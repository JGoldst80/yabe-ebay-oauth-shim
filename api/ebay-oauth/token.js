// /api/ebay-oauth/token
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method_not_allowed' });
    }

    // Accept code/grant from body (builder uses body)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString();

    // Parse x-www-form-urlencoded
    const bodyParams = new URLSearchParams(rawBody);
    const grantType = bodyParams.get('grant_type') || 'authorization_code';

    // Build Basic auth from env
    const basic = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
    ).toString('base64');

    // Build the form eBay expects
    const ebayForm = new URLSearchParams();

    if (grantType === 'refresh_token') {
      const refresh = bodyParams.get('refresh_token') || req.query.refresh_token;
      if (!refresh) return res.status(400).json({ error: 'missing_refresh_token' });
      ebayForm.set('grant_type', 'refresh_token');
      ebayForm.set('refresh_token', refresh);
    } else {
      // Default: authorization_code
      const code = bodyParams.get('code') || req.query.code;
      if (!code) return res.status(400).json({ error: 'missing_code' });
      ebayForm.set('grant_type', 'authorization_code');
      ebayForm.set('code', code);
      // eBay expects the SAME RuName used in /authorize
      ebayForm.set('redirect_uri', process.env.EBAY_RUNAME);
    }

    const r = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: ebayForm.toString(),
    });

    const data = await r.json();

    if (!r.ok) {
      // Pass eBay error back as-is
      return res.status(r.status).json(data);
    }

    // Normalize for GPT Actions
    const normalized = {
      ...data,
      ebay_token_type: data.token_type,
      token_type: 'Bearer',
    };

    return res.status(200).json(normalized);
  } catch (err) {
    console.error('token error', err);
    return res.status(500).json({ error: 'token_exchange_failure' });
  }
}
