// api/ebay-oauth/authorize.js
// Vercel serverless function: redirects to eBay with your RuName as redirect_uri
module.exports = (req, res) => {
  const EBAY_ENV = process.env.EBAY_ENV || "prod";
  const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
  const EBAY_RUNAME = process.env.EBAY_RUNAME; // exact RuName string

  const AUTH = EBAY_ENV === "sandbox"
    ? "https://auth.sandbox.ebay.com/oauth2/authorize"
    : "https://auth.ebay.com/oauth2/authorize";

  const url = new URL(AUTH);
  url.searchParams.set("client_id", EBAY_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", EBAY_RUNAME);
  if (req.query.scope) url.searchParams.set("scope", String(req.query.scope));
  if (req.query.state) url.searchParams.set("state", String(req.query.state));

  res.writeHead(302, { Location: url.toString() });
  res.end();
};
