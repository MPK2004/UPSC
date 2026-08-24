const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const queryOpenRouter = async (prompt: string, systemPrompt: string = 'You are a UPSC faculty expert.') => {
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] Set VITE_OPENROUTER_API_KEY in environment variables.');
    return '';
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://upscreelcastle.vercel.app',
        'X-Title': 'UPSC ReelCastle'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (e) {
    console.error('[OpenRouter Client Error]:', e);
  }
  return '';
};
