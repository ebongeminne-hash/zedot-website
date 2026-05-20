import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://zedot.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, company, how_heard, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const { error: dbError } = await supabase
    .from('contact_submissions')
    .insert([{ name, email, company, how_heard, message }]);

  if (dbError) {
    console.error('Supabase error:', dbError);
    return res.status(500).json({ error: 'Failed to save submission.' });
  }

  await resend.emails.send({
    from: 'Zedot Contact Form <noreply@zedot.tech>',
    to: 'support@zedot.tech',
    subject: `New enquiry from ${name}`,
    html: `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company || 'Not provided'}</p>
      <p><strong>How they heard:</strong> ${how_heard || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
  });

  return res.status(200).json({ success: true, message: 'Message received.' });
}
