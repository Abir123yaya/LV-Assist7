export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const SYSTEM_PROMPT = `You are LV-Assist, a friendly and helpful AI assistant for a school. Your role is to:
- Help students with homework questions and academic topics
- Give study tips and learning strategies
- Provide guidance on school life, time management, and extracurriculars
- Answer general knowledge questions in a clear, student-friendly way
- Be encouraging, positive, and supportive

Keep responses concise and easy to read. Use simple language appropriate for middle and high school students. Do not discuss inappropriate topics.`;

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HF_API_KEY}`
      },
      body: JSON.stringify({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) return res.status(400).json({ error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error) });

    const reply = data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
