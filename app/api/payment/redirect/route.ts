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

    // Fallback: if a provider URL was supplied, validate and check availability before redirect
    if (fallbackUrl) {
      try {
        const parsed = new URL(fallbackUrl);
        // Only allow redirect to Tsara hosted URLs to avoid open-redirect risk
        if (! (parsed.hostname.endsWith('usetsara.com') || parsed.hostname.endsWith('tsara.ng')) ) {
          console.warn('[Payment Redirect] Rejected unsafe fallbackUrl hostname:', parsed.hostname);
          return NextResponse.json({ error: 'Unsafe redirect URL' }, { status: 400 });
        }

        // Do a quick server-side HEAD/GET to validate availability
        try {
          const resp = await fetch(fallbackUrl, { method: 'GET', redirect: 'follow' });
          if (resp.status >= 200 && resp.status < 400) {
            return NextResponse.redirect(fallbackUrl);
          }
          // If provider returns non-2xx, render a helpful fallback page with manual link
          const body = `<!doctype html><html><head><meta charset="utf-8"><title>Payment page unavailable</title></head><body style="font-family: Arial, sans-serif; padding:40px; background:#111;color:#fff;"><h1>Payment page unavailable</h1><p>The payment page at ${parsed.hostname} returned status ${resp.status}. You can try the link manually or contact support.</p><p><a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer" style="color:#0ea5e9;">Open payment page in new tab</a></p><p>If the issue persists, please contact support and provide the payment id: ${plinkId || ''}.</p></body></html>`;
          return new NextResponse(body, { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        } catch (fetchErr: any) {
          console.warn('[Payment Redirect] Error fetching fallbackUrl:', fetchErr?.message || fetchErr);
          const body = `<!doctype html><html><head><meta charset="utf-8"><title>Payment page unavailable</title></head><body style="font-family: Arial, sans-serif; padding:40px; background:#111;color:#fff;"><h1>Payment page unavailable</h1><p>Unable to reach the payment page at ${parsed.hostname}. You can try the link manually or contact support.</p><p><a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer" style="color:#0ea5e9;">Open payment page in new tab</a></p><p>If the issue persists, please contact support and provide the payment id: ${plinkId || ''}.</p></body></html>`;
          return new NextResponse(body, { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
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
