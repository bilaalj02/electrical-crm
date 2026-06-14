const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || 'MES Electrical <noreply@aicoldsolutions.com>';

async function sendInvitationEmail({ to, signupLink, role, companyName }) {
  const roleLabel = role === 'admin' ? 'an administrator' : role === 'technician' ? 'a technician' : 'a team member';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 8px; overflow: hidden;">
      <div style="background: #111; padding: 30px; border-bottom: 2px solid #d4af37;">
        <h1 style="margin: 0; color: #d4af37; font-size: 24px;">${companyName || 'MES Electrical'}</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #fff; margin-top: 0;">You've been invited!</h2>
        <p style="color: #ccc;">You've been invited to join <strong style="color: #fff;">${companyName || 'MES Electrical'}</strong> as ${roleLabel}.</p>
        <p style="color: #ccc;">Click the button below to create your account:</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${signupLink}" style="background-color: #d4af37; color: #000; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            Create Account
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">Or copy and paste this link:</p>
        <p style="color: #999; font-size: 13px; word-break: break-all;">${signupLink}</p>
        <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #222; padding-top: 20px;">
          This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.
        </p>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `You're invited to join ${companyName || 'MES Electrical'}`,
    html
  });
}

module.exports = { sendInvitationEmail };
