// /api/ebay-oauth/token
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method_not_allowed' });
    }

    // Accept code from either body or query (builder uses body)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString();

    // Parse x-www-form-urlencoded
    const bodyParams = new URLSearchParams(rawBody);
    const code = bodyParams.get('code') || req.query.code;
    const grantType = bodyParams.get('grant_type') || 'authorization_code';

    if (!code) {
      return res.status(400).json({ error: 'missing_code' });
    }

    // Build Basic auth from env (do NOT rely on inbound Authorization header)
    const basic = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
    ).toString('base64');

    const ebayForm = new URLSearchParams();
    ebayForm.set('grant_type', grantType);
    ebayForm.set('code', code);
    // eBay requires the SAME RuName used in /authorize
    ebayForm.set('redirect_uri', process.env.EBAY_RUNAME);

    const r = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: ebayForm.toString(),
    });

    const data = await r.json();

    // Pass through eBay token response to the builder
    return res.status(r.status).json(data);
  } catch (err) {
    console.error('token error', err);
    return res.status(500).json({ error: 'token_exchange_failure' });
  }
}
