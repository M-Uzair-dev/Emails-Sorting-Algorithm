import { NextResponse } from 'next/server';

export async function GET(request) {
  const clientId = process.env.NEXT_PUBLIC_QBO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_QBO_REDIRECT_URI;
  const scopes = 'com.intuit.quickbooks.accounting openid email profile';
  const state = Math.random().toString(36).substring(7);

  // Build authorization URL
  const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('scope', scopes);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);

  // Redirect to QuickBooks authorization page
  return NextResponse.redirect(authUrl.toString());
}
