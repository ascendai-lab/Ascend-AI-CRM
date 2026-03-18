// Helper to query Supabase REST API with user's auth token for RLS
async function supabaseQuery(token, table, { select = '*', filters = {}, order, limit } = {}) {
  const url = new URL(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}`)
  url.searchParams.set('select', select)

  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value)
  }

  if (order) url.searchParams.set('order', order)
  if (limit) url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), {
    headers: {
      apikey: process.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    console.error(`Supabase query error for ${table}:`, await res.text())
    return []
  }

  return res.json()
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { message, history } = await req.json()

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get user's auth token for RLS
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const token = authHeader.replace('Bearer ', '')

    // Pull CRM summary data in parallel using user's token
    const [clientServices, companies, deals, tasks, touchpoints] = await Promise.all([
      supabaseQuery(token, 'client_services', {
        select: 'custom_price,status,services(name,type,default_price),companies(name)',
      }),
      supabaseQuery(token, 'companies', { select: 'name,industry' }),
      supabaseQuery(token, 'deals', {
        select: 'name,stage,value,companies(name),contacts(first_name,last_name)',
      }),
      supabaseQuery(token, 'tasks', { select: 'title,due_date,completed' }),
      supabaseQuery(token, 'touchpoints', {
        select: 'date,type,notes,contacts(first_name,last_name)',
        order: 'date.desc',
        limit: 10,
      }),
    ])

    // Calculate MRR
    let mrr = 0
    const activeServices = []
    clientServices.forEach(cs => {
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

    // Deals summary
    const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage))
    const wonDeals = deals.filter(d => d.stage === 'Closed Won')
    const lostDeals = deals.filter(d => d.stage === 'Closed Lost')
    const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value || 0), 0)

    // Tasks summary
    const today = new Date().toISOString().split('T')[0]
    const overdueTasks = tasks.filter(t => !t.completed && t.due_date && t.due_date < today)
    const todayTasks = tasks.filter(t => !t.completed && t.due_date === today)
    const incompleteTasks = tasks.filter(t => !t.completed)

    // Build CRM context
    const crmSummary = `
## CRM Data Summary (as of ${new Date().toLocaleDateString()})

### Revenue
- Monthly Recurring Revenue (MRR): $${mrr.toLocaleString()}
- Active recurring services: ${activeServices.length}
${activeServices.map(s => `  - ${s.service} for ${s.company}: $${s.price}/mo`).join('\n')}

### Clients
- Total companies: ${companies.length}
- Companies: ${companies.map(c => `${c.name} (${c.industry || 'no industry'})`).join(', ') || 'None'}

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
- Total completed: ${tasks.filter(t => t.completed).length}

### Recent Touchpoints (last 10)
${touchpoints.map(tp => `- ${tp.date}: ${tp.type} with ${tp.contacts ? `${tp.contacts.first_name} ${tp.contacts.last_name}` : 'Unknown'}${tp.notes ? ` — "${tp.notes}"` : ''}`).join('\n') || 'None'}
`.trim()

    // System prompt
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
    if (history && history.length > 0) {
      for (const msg of history) {
        geminiContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })
      }
    }
    geminiContents.push({ role: 'user', parts: [{ text: message }] })

    // Call Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to Netlify environment variables.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
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
        JSON.stringify({ error: `AI service error: ${geminiResponse.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
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
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const config = {
  path: '/api/chat',
}
