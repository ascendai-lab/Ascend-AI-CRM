import { createClient } from '@supabase/supabase-js'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { message, history } = await req.json()

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 })
    }

    // Get auth token from request header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Create Supabase client with user's token for RLS
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Pull CRM summary data
    const [
      clientServicesRes,
      companiesRes,
      dealsRes,
      tasksRes,
      touchpointsRes,
    ] = await Promise.all([
      supabase
        .from('client_services')
        .select('custom_price, status, services(name, type, default_price), companies(name)'),
      supabase
        .from('companies')
        .select('name, industry'),
      supabase
        .from('deals')
        .select('name, stage, value, companies(name), contacts(first_name, last_name)'),
      supabase
        .from('tasks')
        .select('title, due_date, completed'),
      supabase
        .from('touchpoints')
        .select('date, type, notes, contacts(first_name, last_name)')
        .order('date', { ascending: false })
        .limit(10),
    ])

    // Calculate MRR
    let mrr = 0
    const activeServices = []
    if (clientServicesRes.data) {
      clientServicesRes.data.forEach(cs => {
        if (cs.status === 'active' && cs.services?.type === 'recurring') {
          const price = cs.custom_price ?? cs.services.default_price ?? 0
          mrr += Number(price)
          activeServices.push({
            service: cs.services.name,
            company: cs.companies?.name,
            price: Number(price),
          })
        }
      })
    }

    // Build deals summary
    const openDeals = (dealsRes.data || []).filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage))
    const wonDeals = (dealsRes.data || []).filter(d => d.stage === 'Closed Won')
    const lostDeals = (dealsRes.data || []).filter(d => d.stage === 'Closed Lost')
    const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value || 0), 0)

    // Build tasks summary
    const today = new Date().toISOString().split('T')[0]
    const allTasks = tasksRes.data || []
    const overdueTasks = allTasks.filter(t => !t.completed && t.due_date && t.due_date < today)
    const todayTasks = allTasks.filter(t => !t.completed && t.due_date === today)
    const incompleteTasks = allTasks.filter(t => !t.completed)

    // Build CRM context
    const crmSummary = `
## CRM Data Summary (as of ${new Date().toLocaleDateString()})

### Revenue
- Monthly Recurring Revenue (MRR): $${mrr.toLocaleString()}
- Active recurring services: ${activeServices.length}
${activeServices.map(s => `  - ${s.service} for ${s.company}: $${s.price}/mo`).join('\n')}

### Clients
- Total companies: ${(companiesRes.data || []).length}
- Companies: ${(companiesRes.data || []).map(c => `${c.name} (${c.industry || 'no industry'})`).join(', ') || 'None'}

### Pipeline
- Open deals: ${openDeals.length} (total value: $${pipelineValue.toLocaleString()})
${openDeals.map(d => `  - "${d.name}" — ${d.stage} — $${Number(d.value || 0).toLocaleString()} — ${d.companies?.name || 'No company'}`).join('\n')}
- Won deals: ${wonDeals.length}
- Lost deals: ${lostDeals.length}

### Tasks
- Overdue tasks: ${overdueTasks.length}
${overdueTasks.map(t => `  - "${t.title}" (due: ${t.due_date})`).join('\n')}
- Due today: ${todayTasks.length}
- Total incomplete: ${incompleteTasks.length}
- Total completed: ${allTasks.filter(t => t.completed).length}

### Recent Touchpoints (last 10)
${(touchpointsRes.data || []).map(tp => `- ${tp.date}: ${tp.type} with ${tp.contacts ? `${tp.contacts.first_name} ${tp.contacts.last_name}` : 'Unknown'}${tp.notes ? ` — "${tp.notes}"` : ''}`).join('\n') || 'None'}
`.trim()

    // Build conversation for Gemini
    const systemPrompt = `You are an AI business analyst for a solo digital marketing agency. Your job is to analyze CRM data and give clear, actionable recommendations.

You have access to the following CRM data:

${crmSummary}

Guidelines:
- Be concise and actionable. Give specific recommendations, not generic advice.
- Reference actual data — mention specific client names, deal names, and numbers.
- If asked about revenue, use the actual MRR and service data provided.
- If asked about priorities, consider overdue tasks, open deals near closing, and clients without recent touchpoints.
- Format responses with markdown for readability.
- If you don't have enough data to answer a question, say so honestly.
- Keep responses focused and under 300 words unless the user asks for a detailed analysis.`

    // Build Gemini messages
    const geminiContents = []

    // Add history
    if (history && history.length > 0) {
      for (const msg of history) {
        geminiContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })
      }
    }

    // Add current message
    geminiContents.push({
      role: 'user',
      parts: [{ text: message }],
    })

    // Call Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500 }
      )
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error:', errText)
      return new Response(
        JSON.stringify({ error: 'AI service error. Please try again.' }),
        { status: 502 }
      )
    }

    const geminiData = await geminiResponse.json()
    const aiMessage = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Sorry, I could not generate a response. Please try again.'

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Chat function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}

export const config = {
  path: '/api/chat',
}
