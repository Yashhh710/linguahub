const https = require('https');
const { env } = require('../config/env');
const fail = require('../utils/httpError');

function callGroq({ apiKey, model, systemPrompt, userPrompt }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6
    });
    const request = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error(`Groq HTTP ${response.statusCode}: ${body.slice(0, 300)}`));
        }
        try {
          const data = JSON.parse(body);
          resolve(JSON.parse(data.choices[0].message.content));
        } catch (error) {
          reject(new Error(`Could not parse Groq response: ${error.message}`));
        }
      });
    });
    request.on('error', reject);
    request.setTimeout(20000, () => { request.destroy(); reject(new Error('Groq request timed out')); });
    request.write(payload);
    request.end();
  });
}

async function callWithFallback(systemPrompt, userPrompt) {
  if (!env.groq.apiKey) throw fail(503, 'AI generation is not configured on this server. Set GROQ_API_KEY in .env to enable it.');
  let lastError;
  for (const model of env.groq.models) {
    try {
      return await callGroq({ apiKey: env.groq.apiKey, model, systemPrompt, userPrompt });
    } catch (error) {
      lastError = error;
      console.warn(`Groq model ${model} failed: ${error.message}`);
    }
  }
  throw fail(502, `AI generation failed: ${lastError?.message || 'all models unavailable'}`);
}

async function generateQuiz({ language, level, topic, count }) {
  const system = `You are a language-curriculum designer. Output ONLY a JSON object, no markdown, matching exactly:
{"title": string, "language": "${language}", "level": "${level}", "topic": "${topic}",
 "questions": [{"question": string, "options": [string,string,string,string], "correctAnswer": 0-3, "explanation": string}]}`;
  const user = `Write ${count} distinct multiple-choice questions to practice ${language} at CEFR level ${level} on the topic "${topic}". Vocabulary, grammar, and polite expressions in realistic situations. Every "correctAnswer" must be a 0-based index into that question's own "options". Explanations are 1 sentence, in English.`;
  const data = await callWithFallback(system, user);
  if (!Array.isArray(data.questions) || !data.questions.length) throw fail(502, 'AI returned an unusable quiz. Please try again.');
  return data;
}

async function generateLesson({ language, level, topic }) {
  const system = `You are a language-curriculum designer. Output ONLY a JSON object, no markdown, matching exactly:
{"title": string, "description": string, "language": "${language}", "level": "${level}", "topic": "${topic}",
 "vocabulary": [{"term": string, "translation": string, "pronunciation": string, "example": string}],
 "grammar": {"title": string, "explanation": string},
 "examples": [{"text": string, "translation": string}],
 "tip": string}`;
  const user = `Write one lesson to learn ${language} at CEFR level ${level} on the topic "${topic}". Include 8-12 vocabulary items with translations and short example sentences, one grammar point relevant to the topic explained in plain English, 3-5 example sentences with translations, and one practical study tip.`;
  const data = await callWithFallback(system, user);
  if (!Array.isArray(data.vocabulary) || !data.vocabulary.length) throw fail(502, 'AI returned an unusable lesson. Please try again.');
  return data;
}

module.exports = { generateQuiz, generateLesson };
