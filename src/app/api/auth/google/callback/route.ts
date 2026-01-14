import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-calendar';

// GET - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Admin email
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('[GOOGLE CALLBACK] OAuth error:', error);
      return NextResponse.redirect(
        new URL('/admin/settings?error=google_auth_denied', request.url)
      );
    }

    if (!code || !state) {
      console.error('[GOOGLE CALLBACK] Missing code or state');
      return NextResponse.redirect(
        new URL('/admin/settings?error=google_auth_failed', request.url)
      );
    }

    // Exchange code for tokens
    await exchangeCodeForTokens(code, state);

    console.log('[GOOGLE CALLBACK] Successfully connected for:', state);

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL('/admin/settings?success=google_connected', request.url)
    );
  } catch (error) {
    console.error('[GOOGLE CALLBACK] Error:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?error=google_auth_failed', request.url)
    );
  }
}
