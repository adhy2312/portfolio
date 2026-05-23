export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Gemini API Key missing' });
  }

  const MODEL = 'gemini-2.5-flash';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const geminiRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await geminiRes.json();
    return res.status(geminiRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
