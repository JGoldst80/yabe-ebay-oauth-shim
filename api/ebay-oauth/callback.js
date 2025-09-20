// /api/ebay-oauth/callback
export default async function handler(req, res) {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.status(400).json({ error: 'missing_code_or_state' });
    }

    // Recover builder redirect + state from cookies
    const cookieHeader = req.headers.cookie || '';
    const uriMatch = cookieHeader.match(/(?:^|;)\s*builder_redirect_uri=([^;]+)/);
    const stateMatch = cookieHeader.match(/(?:^|;)\s*builder_state=([^;]+)/);

    const builderRedirectFromCookie = uriMatch ? decodeURIComponent(uriMatch[1]) : null;
    const builderStateFromCookie = stateMatch ? decodeURIComponent(stateMatch[1]) : null;

    // Fallback to env var if cookie missing
    const builderReturnUrl = builderRedirectFromCookie || process.env.OPENAI_BUILDER_CALLBACK;
    if (!builderReturnUrl) {
      return res.status(500).json({ error: 'missing_builder_return_url' });
    }

    // Optional: warn if state differs (builder still validates)
    if (builderStateFromCookie && builderStateFromCookie !== state) {
      console.warn('state mismatch', { expected: builderStateFromCookie, returned: state });
    }

    // Append both code + state for the builder
    const redirect = new URL(builderReturnUrl);
    redirect.searchParams.set('code', code);
    redirect.searchParams.set('state', state);

    // Clear cookies
    res.setHeader('Set-Cookie', [
      'builder_redirect_uri=; Path=/api/ebay-oauth; Max-Age=0; HttpOnly; Secure; SameSite=None',
      'builder_state=; Path=/api/ebay-oauth; Max-Age=0; HttpOnly; Secure; SameSite=None',
    ]);

    return res.redirect(302, redirect.toString());
  } catch (err) {
    console.error('callback error', err);
    return res.status(500).json({ error: 'callback_failure' });
  }
}
