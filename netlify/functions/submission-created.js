/**
 * Netlify Function — submission-created
 * Fires automatically on every Netlify Forms submission.
 * Sends a reply email with a download link for the two document forms.
 */

const RESEND_API = 'https://api.resend.com/emails';

// Document config — update filenames here when real PDFs are ready
const DOCS = {
  'speaker-presentation': {
    filename: 'speaker-presentation.pdf',
    label:    'Speaker Presentation',
    subject:  'Your download: Speaker Presentation — Deloitte Digital × LID 2026',
  },
  'agentic-customer-research': {
    filename: 'agentic-customer-research.pdf',
    label:    'The Agentic Customer',
    subject:  'Your download: The Agentic Customer — Deloitte Digital × LID 2026',
  },
};

exports.handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body);
    const formName  = payload.data['form-name'];
    const doc       = DOCS[formName];

    // Not a download form (meet-ticino, visit-italian-ai-center) — nothing to send
    if (!doc) return { statusCode: 200, body: 'no-op' };

    const firstName   = payload.data['first-name'] || 'there';
    const toEmail     = payload.data['email'];
    const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';

    // DEPLOY_URL is injected by Netlify — correct for both staging and production
    const baseUrl     = (process.env.DEPLOY_URL || '').replace(/\/$/, '');
    const downloadUrl = `${baseUrl}/downloads/${doc.filename}`;

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    fromAddress,
        to:      toEmail,
        subject: doc.subject,
        html:    buildEmail(firstName, doc.label, downloadUrl),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return { statusCode: 500, body: err };
    }

    return { statusCode: 200, body: 'sent' };

  } catch (err) {
    console.error('submission-created error:', err);
    return { statusCode: 500, body: err.message };
  }
};

// ── Email template ────────────────────────────────────────────────────────────
function buildEmail(firstName, docLabel, downloadUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0ec;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ec;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0e0d8;">

          <!-- Header -->
          <tr>
            <td style="background:#080808;padding:28px 36px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);letter-spacing:0.04em;">Deloitte Digital · Lugano</p>
              <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.04em;">Lifestyle Innovation Day 2026</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9FD235;">Your download is ready</p>
              <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#080808;line-height:1.25;">${docLabel}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.6;">
                Hi ${firstName},<br><br>
                Thanks for stopping by our stand at LID 2026. Your document is ready — click the button below to download it.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#9FD235;border-radius:40px;">
                    <a href="${downloadUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#000000;text-decoration:none;">
                      Download ${docLabel} →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${downloadUrl}" style="color:#080808;word-break:break-all;">${downloadUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #e0e0d8;">
              <p style="margin:0;font-size:11px;color:#aaa;line-height:1.6;">
                Deloitte Digital · Lugano &nbsp;·&nbsp; Lifestyle Innovation Day 2026 &nbsp;·&nbsp; 18 May &nbsp;·&nbsp; LAC Lugano<br>
                You're receiving this because you requested a document at our stand.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
