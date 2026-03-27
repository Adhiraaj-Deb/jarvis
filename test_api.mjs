const key = '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'
const llamaKey = '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'

async function test(label, apiKey, model) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jarvis.synalpy.local',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'say hi' }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    })
    const text = await res.text()
    console.log(`\n[${label}] Status: ${res.status}`)
    console.log(`[${label}] Body: ${text.slice(0, 500)}`)
  } catch(e) {
    console.log(`[${label}] ERROR: ${e.message}`)
  }
}

async function listModels(apiKey) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const data = await res.json()
    const free = data.data?.filter(m => m.id.includes('glm') || m.id.includes('llama-3.3') || m.id.includes('qwen'))
    console.log('\n[Models] Matching free models:')
    free?.forEach(m => console.log(' -', m.id))
  } catch(e) {
    console.log('[Models] ERROR:', e.message)
  }
}

listModels(key).then(() => {
  test('GLM Air', key, 'zhipu/glm-4.5-air:free')
  test('Llama 70B', llamaKey, 'meta-llama/llama-3.3-70b-instruct:free')
})
