// /api/ebay-oauth/authorize
export default async function handler(req, res) {
  try {
    const stateFromBuilder = req.query.state;
    const builderRedirectUri = req.query.redirect_uri; // ChatGPT builder will send this

    if (!stateFromBuilder || !builderRedirectUri) {
      return res.status(400).json({ error: 'missing_state_or_redirect_uri' });
    }

    // Persist builder redirect + state in cookies for 10 minutes
    res.setHeader('Set-Cookie', [
      `builder_redirect_uri=${encodeURIComponent(builderRedirectUri)}; Path=/api/ebay-oauth; HttpOnly; Secure; SameSite=None; Max-Age=600`,
      `builder_state=${encodeURIComponent(stateFromBuilder)}; Path=/api/ebay-oauth; HttpOnly; Secure; SameSite=None; Max-Age=600`,
    ]);

    // eBay requested scopes (space-separated)
    const scope = [
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/buy.browse',
    ].join(' ');

    // Construct eBay authorize URL
    const auth = new URL('https://auth.ebay.com/oauth2/authorize');
    auth.searchParams.set('client_id', process.env.EBAY_CLIENT_ID);
    auth.searchParams.set('response_type', 'code');

    // IMPORTANT: eBay requires your registered RuName here (not the builder URL)
    auth.searchParams.set('redirect_uri', process.env.EBAY_RUNAME);

    auth.searchParams.set('scope', scope);

    // Echo the builder's state unchanged so the builder can validate later
    auth.searchParams.set('state', stateFromBuilder);

    return res.redirect(302, auth.toString());
  } catch (err) {
    console.error('authorize error', err);
    return res.status(500).json({ error: 'authorize_failure' });
  }
}
