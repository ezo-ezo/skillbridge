// Optional AI-written match explanation. Falls back to the deterministic text on any failure.
const config = require('../utils/config');

const cache = new Map();

async function explainMatch(studentSummary, opportunity, match) {
  if (!config.openai.key) return { text: match.explanation, source: 'rules' };
  const key = `${studentSummary.id}:${opportunity.id}:${match.score}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${config.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openai.key}` },
      body: JSON.stringify({
        model: config.openai.model,
        max_tokens: 160,
        messages: [
          {
            role: 'system',
            content:
              'Write a 2-sentence, encouraging, factual explanation of why a student matches an opportunity. Mention verified skills and one gap to work on. No markdown.',
          },
          {
            role: 'user',
            content: JSON.stringify({ student: studentSummary, opportunity: { title: opportunity.title, type: opportunity.type }, match }),
          },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('empty AI response');
    const out = { text, source: 'ai' };
    cache.set(key, out);
    return out;
  } catch (e) {
    console.warn('AI explanation failed, using rules:', e.message);
    return { text: match.explanation, source: 'rules' };
  }
}

module.exports = { explainMatch };
