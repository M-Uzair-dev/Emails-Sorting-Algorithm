import { NextResponse } from 'next/server';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const state = searchParams.get('state');

  if (!code || !realmId) {
    console.error('Missing authorization code or realmId');
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_QBO_CLIENT_ID;
    const clientSecret = process.env.QBO_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_QBO_REDIRECT_URI;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/?error=token_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Tokens received successfully');
    console.log('Access Token:', tokenData.access_token);
    console.log('Realm ID:', realmId);

    // Fetch customer data
    const environment = process.env.QBO_ENVIRONMENT || 'sandbox';
    const baseUrl = environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';

    const customersResponse = await fetch(
      `${baseUrl}/v3/company/${realmId}/query?query=SELECT * FROM Customer`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!customersResponse.ok) {
      const errorData = await customersResponse.json();
      console.error('Failed to fetch customers:', errorData);
      return NextResponse.redirect(new URL('/?error=fetch_failed', request.url));
    }

    const customersData = await customersResponse.json();
    const customers = customersData.QueryResponse?.Customer || [];

    // Extract and log customer information
    const customerInfo = customers.map((customer) => ({
      id: customer.Id,
      displayName: customer.DisplayName,
      givenName: customer.GivenName || '',
      familyName: customer.FamilyName || '',
      companyName: customer.CompanyName || '',
      primaryEmail: customer.PrimaryEmailAddr?.Address || '',
      ccEmails: customer.CcEmail
        ? customer.CcEmail.split(',').map((email) => email.trim())
        : [],
    }));

    console.log('\n========================================');
    console.log('📧 CUSTOMER DATA FROM QUICKBOOKS');
    console.log('========================================');
    console.log(`Total Customers: ${customerInfo.length}`);
    console.log('\nCustomer Details:');
    customerInfo.forEach((customer, index) => {
      console.log(`\n--- Customer ${index + 1} ---`);
      console.log(`ID: ${customer.id}`);
      console.log(`Name: ${customer.displayName}`);
      console.log(`Given Name: ${customer.givenName}`);
      console.log(`Family Name: ${customer.familyName}`);
      console.log(`Company: ${customer.companyName}`);
      console.log(`Primary Email: ${customer.primaryEmail}`);
      console.log(`CC Emails: ${customer.ccEmails.length > 0 ? customer.ccEmails.join(', ') : 'None'}`);
    });
    console.log('\n========================================\n');

    // Redirect back to home page with success message
    return NextResponse.redirect(new URL('/?qbo_connected=true', request.url));

  } catch (error) {
    console.error('Error during QuickBooks OAuth callback:', error);
    return NextResponse.redirect(new URL('/?error=unknown', request.url));
  }
}
