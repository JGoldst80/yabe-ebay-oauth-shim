// /api/ebay-oauth/authorize
export default async function handler(req, res) {
  try {
    const stateFromBuilder = req.query.state;
    const builderRedirectUri = req.query.redirect_uri; // ChatGPT builder sends this

    if (!stateFromBuilder || !builderRedirectUri) {
      return res.status(400).json({ error: 'missing_state_or_redirect_uri' });
    }

    // Save builder redirect + state in cookies (10 minutes)
    res.setHeader('Set-Cookie', [
      `builder_redirect_uri=${encodeURIComponent(builderRedirectUri)}; Path=/api/ebay-oauth; HttpOnly; Secure; SameSite=None; Max-Age=600`,
      `builder_state=${encodeURIComponent(stateFromBuilder)}; Path=/api/ebay-oauth; HttpOnly; Secure; SameSite=None; Max-Age=600`
    ]);

    const scope = [
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/buy.browse'
    ].join(' ');

    const auth = new URL('https://auth.ebay.com/oauth2/authorize');
    auth.searchParams.set('client_id', process.env.EBAY_CLIENT_ID);
    auth.searchParams.set('response_type', 'code');
    // eBay expects your registered RuName string here (not a URL)
    auth.searchParams.set('redirect_uri', process.env.EBAY_RUNAME);
    auth.searchParams.set('scope', scope);
    // Important: echo the builder's state unchanged
    auth.searchParams.set('state', stateFromBuilder);

    return res.redirect(302, auth.toString());
  } catch (err) {
    console.error('authorize error', err);
    return res.status(500).json({ error: 'authorize_failure' });
  }
}
