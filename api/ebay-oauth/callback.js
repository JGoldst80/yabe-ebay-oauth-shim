// Vercel serverless function: handle callback from eBay to redirect back to ChatGPT builder

function decodeState(str) {
  // Convert URL-safe base64 to standard base64
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if necessary
  while (str.length % 4) {
    str += '=';
  }
  const json = Buffer.from(str, 'base64').toString();
  return JSON.parse(json);
}

module.exports = (req, res) => {
  const { code, state } = req.query;
  let saved = null;

  // Retrieve the ebay_oauth_state cookie
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/ebay_oauth_state=([^;]+)/);
  if (match) {
    try {
      saved = decodeState(match[1]);
    } catch (err) {
      // ignore decoding errors
    }
  }

  // Validate code and state
  if (!code || !state || !saved || state !== saved.state) {
    res.statusCode = 400;
    res.end('Invalid state or missing code');
    return;
  }

  // Clear the cookie
  res.setHeader('Set-Cookie', 'ebay_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0');

  const redirectUri = saved.redirect_uri;

  // Redirect back to the builder's redirect_uri with the code and state
  res.writeHead(302, {
    Location: `${redirectUri}?code=${code}&state=${state}`,
  });
  res.end();
};
