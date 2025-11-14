export async function sendVerificationEmail(email: string, token: string) {
  console.log(`Sending verification email to: ${email} with token: ${token}`);
  return { ok: true };
}
