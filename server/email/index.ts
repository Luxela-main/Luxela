import sendEmail from '../../lib/sender';

export async function sendOtp(
  email: string,
  otp: string,
): Promise<{ success: true }> {
  const subject = 'Your Luxela OTP Code';
  const html = `
    <div style="font-family: sans-serif;">
      <h2>Luxela OTP</h2>
      <p>Your OTP code is: <b>${otp}</b></p>
      <p>This code will expire in 10 minutes.</p>
    </div>
  `;
  try {
    await sendEmail(email, subject, html);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Failed to send email:', err.message);
      throw err;
    } else {
      console.error('Unknown error sending email');
      throw new Error('Unknown error sending email');
    }
  }
}