import PasswordResetConfirmationEmail from '@/lib/emails/password-reset-confirmation-email';
import VerificationEmail from '@/lib/emails/verification-email';
import WelcomeEmail from '@/lib/emails/welcome-email';
import { createAdminClient } from '@/utils/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { type, email, password, isPasswordReset, origin } =
      await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let data;

    switch (type) {
      case 'verification':
        const supabase = createAdminClient();
        const res = await supabase.auth.admin.generateLink({
          type: isPasswordReset ? 'recovery' : 'signup',
          email,
          password: isPasswordReset ? undefined : password,
        });

        if (res.data.properties?.email_otp) {
          data = await resend.emails.send({
            from: 'Luxela <team@luxela.com>',
            to: email,
            subject: isPasswordReset
              ? 'Reset your password'
              : 'Verify your email',
            react: VerificationEmail({
              otp: res.data.properties?.email_otp,
              isPasswordReset: !!isPasswordReset,
            }),
          });
        } else {
          return NextResponse.json({ data: null, error: res.error });
        }

        break;

      case 'welcome':
        const redirectUrl = origin
          ? `${origin}/`
          : `${new URL(request.url).origin}/`;

        data = await resend.emails.send({
          from: 'Luxela <team@luxela.com>',
          to: email,
          subject: 'Welcome to Luxela',
          react: WelcomeEmail({
            userEmail: email,
            redirectUrl
          }),
        });
        break;

      case 'password-reset-confirmation':
        const loginUrl = origin
          ? `${origin}/auth/login`
          : `${new URL(request.url).origin}/login`;

        data = await resend.emails.send({
          from: 'Luxela <team@luxela.com>',
          to: email,
          subject: 'Your password has been reset',
          react: PasswordResetConfirmationEmail({
            userEmail: email,
            loginUrl,
          }),
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}