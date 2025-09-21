// /api/ebay-oauth/token
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method_not_allowed' });
    }

    // Read x-www-form-urlencoded body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString();
    const bodyParams = new URLSearchParams(rawBody);

    const code = bodyParams.get('code') || req.query.code;
    const grantType = bodyParams.get('grant_type') || 'authorization_code';

    if (!code) {
      return res.status(400).json({ error: 'missing_code' });
    }

    // Build Basic auth from env
    const basic = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
    ).toString('base64');

    const form = new URLSearchParams();
    form.set('grant_type', grantType);
    form.set('code', code);
    // Must match authorize redirect_uri (RuName string)
    form.set('redirect_uri', process.env.EBAY_RUNAME);

    const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err) {
    console.error('token error', err);
    return res.status(500).json({ error: 'token_exchange_failure' });
  }
}
