import { NextResponse } from 'next/server';
import { retrievePaymentLink } from '@/server/services/tsara';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const plinkId = url.searchParams.get('plinkId') || url.searchParams.get('id');
    const fallbackUrl = url.searchParams.get('url') || url.searchParams.get('paymentUrl') || null;
    if (!plinkId && !fallbackUrl) {
      return NextResponse.json({ error: 'plinkId or url is required' }, { status: 400 });
    }

    // Attempt to retrieve canonical payment link from Tsara if plinkId present
    if (plinkId) {
      try {
        const fetched = await retrievePaymentLink(plinkId);
        const fetchedData: any = (fetched as any)?.data || fetched;
        const targetUrl = fetchedData?.url || fetchedData?.checkout_url || fetchedData?.link || fetchedData?.payment_url;
        if (targetUrl) return NextResponse.redirect(targetUrl);
        console.warn('[Payment Redirect] retrievePaymentLink returned no url for', plinkId);
      } catch (e: any) {
        console.warn('[Payment Redirect] retrievePaymentLink failed for', plinkId, e?.message || e);
      }
    }

    // Fallback: if a provider URL was supplied, validate and redirect
    if (fallbackUrl) {
      try {
        const parsed = new URL(fallbackUrl);
        // Only allow redirect to Tsara hosted URLs to avoid open-redirect risk
        if (parsed.hostname.endsWith('usetsara.com') || parsed.hostname.endsWith('tsara.ng')) {
          return NextResponse.redirect(fallbackUrl);
        }
        console.warn('[Payment Redirect] Rejected unsafe fallbackUrl hostname:', parsed.hostname);
        return NextResponse.json({ error: 'Unsafe redirect URL' }, { status: 400 });
      } catch (e: any) {
        console.warn('[Payment Redirect] Invalid fallbackUrl format:', fallbackUrl, e?.message || e);
        return NextResponse.json({ error: 'Invalid url format' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Payment link not available' }, { status: 404 });
  } catch (err: any) {
    console.error('[Payment Redirect] Unexpected error:', err?.message || err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
