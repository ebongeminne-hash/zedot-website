import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ZEDOT_SYSTEM_PROMPT = `You are Dotty, the intelligent assistant for Zedot Technologies — a Lagos-based tech company that builds scalable software, DevOps infrastructure, AI integrations, cybersecurity solutions, data engineering pipelines, and QA systems.

Your role is to:
- Answer questions about Zedot's services clearly and confidently
- Help visitors understand what Zedot does and how to engage
- Encourage qualified prospects to fill in the contact form or email support@zedot.tech
- Be concise — 2-4 sentences per response unless asked for detail
- Sound like a knowledgeable colleague, not a generic chatbot

Zedot's core services:
1. Software Development — custom web apps, mobile, APIs, enterprise systems
2. DevOps & Cloud — CI/CD, Kubernetes, GitOps, AWS/GCP/Azure
3. AI & Automation — ML integration, NLP pipelines, agentic AI, process automation
4. Cybersecurity — pen testing, threat modelling, SIEM, NDPR/ISO 27001 compliance
5. Data Engineering — warehouses, ETL/ELT, BigQuery, dbt, BI dashboards
6. QA & Testing — Playwright, automated regression, performance testing

Key facts:
- Based in Lagos, Nigeria. African-built tech competing globally.
- Email: support@zedot.tech
- Ethos: Grit, resilience, transparency, security-first, customer-centric, AI-first

Do not make up project names, pricing, or client details not stated above.
If asked something outside your knowledge, say so and suggest they email the team directly.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://zedot.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const messages = [
    ...history.slice(-6),
    { role: 'user', content: message }
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: ZEDOT_SYSTEM_PROMPT,
      messages
    });

    const reply = response.content[0].text;
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Anthropic error:', err);
    return res.status(500).json({ error: 'Dotty is having a moment. Try again shortly.' });
  }
}
