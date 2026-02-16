import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Auth Session] Verifying session from server...');
    
    const supabase = await createClient();
    
    // Get session from server-side cookies
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Auth Session] Session error:', error.message);
      return NextResponse.json(
        { user: null, error: error.message },
        { status: 401 }
      );
    }
    
    const user = data?.session?.user || null;
    
    if (!user) {
      console.log('[Auth Session] No session found');
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }
    
    console.log('[Auth Session] Session verified, user:', user.id);
    
    // Return user with cache disabled to ensure fresh data
    const response = NextResponse.json({ user }, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth Session] Error:', errorMessage);
    
    return NextResponse.json(
      { user: null, error: errorMessage },
      { status: 500 }
    );
  }
}