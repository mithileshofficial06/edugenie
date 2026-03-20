require('dotenv').config();
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { withRetry } = require('../utils/retry');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/** Shared dark email wrapper */
const wrap = (content) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0a0a;">
${content}
</table>
</td></tr></table>
</body></html>`;

const headerBlock = (subtitle, accent = '#00ffff') => `
<tr><td style="padding:32px 24px 24px;border-bottom:2px solid ${accent};">
  <div style="font-size:12px;font-weight:700;color:${accent};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">&#129518; EDUGENIE</div>
  <div style="font-size:28px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-0.02em;">${subtitle}</div>
</td></tr>`;

const footerBlock = () => `
<tr><td style="padding:24px;border-top:1px solid #00ffff;">
  <div style="font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.08em;">EduGenie AI — Academic Intelligence</div>
  <div style="font-size:11px;color:#444;margin-top:4px;">This material was auto-generated based on your Moodle course content.</div>
</td></tr>`;

const formatDate = (d) => {
  if (!d) return 'No deadline set';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/** Convert AI markdown output to clean, styled HTML for emails */
const markdownToHtml = (text) => {
  if (!text) return 'No content generated.';
  return text
    // Horizontal rules — remove
    .replace(/^---+$/gm, '')
    // Headers ### **text** or ### text — styled heading
    .replace(/^#{1,4}\s*\*{0,2}(.+?)\*{0,2}\s*$/gm, '<div style="font-size:16px;font-weight:900;color:#00ffff;text-transform:uppercase;margin:20px 0 8px;border-bottom:1px solid #333;padding-bottom:6px;">$1</div>')
    // Bold **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;">$1</strong>')
    .replace(/__(.+?)__/g, '<strong style="color:#fff;">$1</strong>')
    // Italic *text* or _text_ (single)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Bullet points — styled list items
    .replace(/^\s*[-•]\s+(.+)$/gm, '<div style="padding:3px 0 3px 16px;border-left:2px solid #333;">$1</div>')
    // Question numbers Q1-Q10 — cyan highlight
    .replace(/(Q\d+[\.\):])/gi, '<span style="color:#00ffff;font-weight:900;font-size:15px;">$1</span>')
    // Answer/Explanation labels — green highlight
    .replace(/(Answer:|Correct Answer:|ANSWER:|Explanation:|EXPLANATION:)/gi, '<span style="color:#00ff88;font-weight:700;">$1</span>')
    // Option letters A) B) C) D) — subtle highlight
    .replace(/^\s*([A-D][\)\.])/gm, '<span style="color:#aaa;font-weight:600;">$1</span>')
    // Checkmark emoji ✅ — keep but style
    .replace(/✅/g, '<span style="color:#00ff88;">✔</span>')
    // Newlines to <br>
    .replace(/\n/g, '<br>')
    // Clean up multiple <br>s
    .replace(/(<br>){3,}/g, '<br><br>');
};

/** Send helper with retry */
const send = async (to, subject, html) => {
  try {
    await withRetry(
      () => transporter.sendMail({
        from: `"EduGenie" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      }),
      { retries: 3, baseDelay: 2000, label: `Email to ${to}` }
    );
    logger.success(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Email error to ${to} after retries: ${error.message}`);
    return false;
  }
};

/* ═══════════════════════════════════════
   FUNCTION 1: WELCOME EMAIL
   ═══════════════════════════════════════ */
const sendWelcomeEmail = async (to) => {
  const html = wrap(`
    ${headerBlock('You Are Now Protected')}
    <tr><td style="padding:32px 24px;">
      <div style="font-size:18px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:16px;">YOUR MOODLE IS NOW BEING MONITORED</div>
      <p style="font-size:14px;color:#999;line-height:1.7;margin:0 0 24px;">EduGenie will scan your Moodle every 2 hours. The moment a new assignment, quiz, or study material is detected, you will be notified instantly.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="48%" valign="top" style="background:#111;border:1px solid #00ffff;padding:20px;">
          <div style="font-size:14px;font-weight:900;color:#00ffff;text-transform:uppercase;margin-bottom:8px;">WHATSAPP</div>
          <p style="font-size:13px;color:#999;line-height:1.6;margin:0;">Instant alerts when new content is detected. Deadline reminders at 24 hours, 2 hours, and 1 hour before every due date.</p>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="background:#111;border:1px solid #8b5cf6;padding:20px;">
          <div style="font-size:14px;font-weight:900;color:#8b5cf6;text-transform:uppercase;margin-bottom:8px;">EMAIL</div>
          <p style="font-size:13px;color:#999;line-height:1.6;margin:0;">Full AI generated question banks for every quiz. Structured study documents for every assignment. High quality academic content delivered directly here.</p>
        </td>
      </tr></table>
      <div style="margin-top:24px;padding:16px;border:1px solid #00ff88;background:rgba(0,255,136,0.05);text-align:center;">
        <div style="font-size:14px;font-weight:900;color:#00ff88;text-transform:uppercase;letter-spacing:0.06em;">You will never miss a deadline again.</div>
      </div>
    </td></tr>
    <tr><td style="padding:16px 24px;border-top:1px solid #00ffff;">
      <div style="font-size:12px;color:#666;text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">EduGenie — Built for students who refuse to fall behind.</div>
    </td></tr>
  `);
  return send(to, 'EduGenie — You Are Now Protected', html);
};

/* ═══════════════════════════════════════
   FUNCTION 2: QUIZ EMAIL
   ═══════════════════════════════════════ */
const sendQuizEmail = async (to, quiz, questionBank) => {
  const due = formatDate(quiz.dueDate);
  const time = formatTime(quiz.dueDate);

  // Parse question bank text into clean, formatted HTML
  const formattedQB = markdownToHtml(questionBank);

  const html = wrap(`
    ${headerBlock('Quiz Preparation Material')}
    <tr><td style="padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#111;border-left:4px solid #00ffff;padding:20px;">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">QUIZ</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${quiz.title}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">COURSE</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${quiz.courseName}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">DUE DATE</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${due} ${time}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">PREPARED BY</td><td style="font-size:14px;color:#00ffff;font-weight:700;padding:4px 0 4px 16px;">EduGenie AI</td></tr>
          </table>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 24px 24px;">
      <div style="border:1px solid #ffd700;background:#1a1500;padding:16px;">
        <div style="font-size:13px;font-weight:900;color:#ffd700;text-transform:uppercase;margin-bottom:4px;">Important</div>
        <p style="font-size:13px;color:#ccc;line-height:1.6;margin:0;">Study these questions carefully. They are generated based on your course topic. Cover all questions before your quiz.</p>
      </div>
    </td></tr>
    <tr><td style="padding:0 24px;">
      <div style="font-size:18px;font-weight:900;color:#ffffff;text-transform:uppercase;margin-bottom:4px;">Mock Question Bank</div>
      <div style="font-size:12px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:16px;">AI Generated — Based on Course Material</div>
      <div style="background:#111;border:1px solid #222;padding:24px;font-size:14px;color:#ddd;line-height:1.8;">
        ${formattedQB}
      </div>
    </td></tr>
    <tr><td style="padding:24px;">
      <div style="font-size:15px;font-weight:900;color:#ffffff;text-transform:uppercase;margin-bottom:12px;">Exam Tips</div>
      <div style="background:#111;border:1px solid #333;padding:16px;">
        <div style="font-size:13px;color:#999;line-height:2;">
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Read each question twice before answering</div>
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Attempt all questions — no negative marking</div>
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Review your answers if time permits</div>
          <div style="padding:4px 0;">&#x2022; Focus on definitions and key concepts</div>
        </div>
      </div>
    </td></tr>
    ${footerBlock()}
  `);
  return send(to, `EduGenie — Quiz Prep Ready: ${quiz.title}`, html);
};

/* ═══════════════════════════════════════
   FUNCTION 3: ASSIGNMENT EMAIL
   ═══════════════════════════════════════ */
const sendAssignmentEmail = async (to, assignment, studyDoc) => {
  const due = formatDate(assignment.dueDate);

  // Parse study document into clean, formatted HTML
  const formattedDoc = markdownToHtml(studyDoc);

  const html = wrap(`
    ${headerBlock('Assignment Study Material', '#8b5cf6')}
    <tr><td style="padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#111;border-left:4px solid #8b5cf6;padding:20px;">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">ASSIGNMENT</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${assignment.title}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">COURSE</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${assignment.courseName}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">DUE DATE</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${due}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">PREPARED BY</td><td style="font-size:14px;color:#8b5cf6;font-weight:700;padding:4px 0 4px 16px;">EduGenie AI</td></tr>
          </table>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 24px 24px;">
      <div style="border:1px solid #00ffff;background:#001a1a;padding:16px;">
        <div style="font-size:13px;font-weight:900;color:#00ffff;text-transform:uppercase;margin-bottom:4px;">Important</div>
        <p style="font-size:13px;color:#ccc;line-height:1.6;margin:0;">This document will help you understand the topic deeply. Read it fully before writing your assignment. Use it as a reference — write in your own words.</p>
      </div>
    </td></tr>
    <tr><td style="padding:0 24px;">
      <div style="font-size:18px;font-weight:900;color:#ffffff;text-transform:uppercase;margin-bottom:4px;">Study Document</div>
      <div style="font-size:12px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:16px;">AI Generated — Course Specific Content</div>
      <div style="background:#111;border:1px solid #222;padding:24px;font-size:14px;color:#ddd;line-height:1.8;">
        ${formattedDoc}
      </div>
    </td></tr>
    <tr><td style="padding:24px;">
      <div style="font-size:15px;font-weight:900;color:#ffffff;text-transform:uppercase;margin-bottom:12px;">Writing Your Assignment</div>
      <div style="background:#111;border:1px solid #333;padding:16px;">
        <div style="font-size:13px;color:#999;line-height:2;">
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Start with a clear introduction defining the main topic</div>
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Use headings and subheadings to organize your content</div>
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Support every point with examples</div>
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Write a strong conclusion summarizing key points</div>
          <div style="padding:4px 0;">&#x2022; Proofread before submitting</div>
        </div>
      </div>
    </td></tr>
    ${footerBlock()}
  `);
  return send(to, `EduGenie — Study Material Ready: ${assignment.title}`, html);
};

/* ═══════════════════════════════════════
   FUNCTION 4: NOTES/RESOURCE EMAIL
   ═══════════════════════════════════════ */
const sendNotesEmail = async (to, resource, courseName) => {
  const resourceUrl = resource.resourceUrl || resource.url || '#';
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const html = wrap(`
    ${headerBlock('New Study Material Uploaded', '#00ff88')}
    <tr><td style="padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#111;border-left:4px solid #00ff88;padding:20px;">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">SUBJECT</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${courseName}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">FILE</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${resource.title || resource.name}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">UPLOADED</td><td style="font-size:14px;color:#fff;font-weight:700;padding:4px 0 4px 16px;">${today}</td></tr>
            <tr><td style="font-size:11px;color:#666;text-transform:uppercase;font-weight:700;padding:4px 0;">ACCESS</td><td style="font-size:14px;color:#00ff88;font-weight:700;padding:4px 0 4px 16px;">Direct Moodle Link</td></tr>
          </table>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 24px 24px;" align="center">
      <a href="${resourceUrl}" target="_blank" style="display:inline-block;padding:16px 48px;background:#0a0a0a;border:2px solid #00ffff;color:#00ffff;font-size:14px;font-weight:900;text-transform:uppercase;text-decoration:none;letter-spacing:0.08em;">ACCESS STUDY MATERIAL</a>
    </td></tr>
    <tr><td style="padding:0 24px 24px;">
      <div style="font-size:15px;font-weight:900;color:#ffffff;text-transform:uppercase;margin-bottom:12px;">How To Use This Material</div>
      <div style="background:#111;border:1px solid #333;padding:16px;">
        <div style="font-size:13px;color:#999;line-height:2;">
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Download and save the file immediately — it may be removed later</div>
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Read through completely once before your next class</div>
          <div style="border-bottom:1px solid #222;padding:4px 0;">&#x2022; Make short notes from key points</div>
          <div style="padding:4px 0;">&#x2022; Refer back before exams and quizzes</div>
        </div>
      </div>
    </td></tr>
    <tr><td style="padding:16px 24px;border-top:1px solid #00ff88;">
      <div style="font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.08em;">EduGenie AI — Academic Intelligence</div>
      <div style="font-size:11px;color:#444;margin-top:4px;">Your professor just uploaded this material. Stay ahead.</div>
    </td></tr>
  `);
  return send(to, `EduGenie — New Study Material: ${resource.title || resource.name}`, html);
};

module.exports = {
  sendWelcomeEmail,
  sendQuizEmail,
  sendAssignmentEmail,
  sendNotesEmail
};
