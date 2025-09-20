// Vercel serverless function: store builder's redirect_uri & state in cookie and redirect to eBay with RuName
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_RUNAME    = process.env.EBAY_RUNAME; // exact RuName string

// Helper to base64url encode JSON object
function encodeState(obj) {
  const json = JSON.stringify(obj);
  const base64 = Buffer.from(json).toString('base64');
  // Convert to URL-safe base64
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = (req, res) => {
  // The ChatGPT builder calls this endpoint with client_id, redirect_uri, scope, state
  const { redirect_uri, scope, state } = req.query;

  // Save the builder's redirect_uri and state in a cookie for later
  if (redirect_uri && state) {
    const cookieValue = encodeState({ redirect_uri, state });
    // Set cookie for 5 minutes
    res.setHeader('Set-Cookie', `ebay_oauth_state=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=300`);
  }

  // Construct eBay authorization URL using RuName as redirect_uri
  const params = new URLSearchParams({
    client_id: EBAY_CLIENT_ID,
    redirect_uri: EBAY_RUNAME,
    response_type: 'code',
    scope: scope || '',
    state: state || '',
  });

  res.writeHead(302, {
    Location: `https://auth.ebay.com/oauth2/authorize?${params.toString()}`,
  });
  res.end();
};
