// api/ebay-oauth/token.js
// Vercel serverless function: exchanges code/refresh/client_credentials for tokens;
// forces redirect_uri to your RuName for authorization_code flow
module.exports = async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const incoming = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));

    const EBAY_ENV = process.env.EBAY_ENV || "prod";
    const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
    const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
    const EBAY_RUNAME = process.env.EBAY_RUNAME;

    const TOKEN = EBAY_ENV === "sandbox"
      ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
      : "https://api.ebay.com/identity/v1/oauth2/token";

    const gt = incoming.get("grant_type");
    const f = new URLSearchParams();

    if (gt === "authorization_code") {
      f.set("grant_type", "authorization_code");
      f.set("code", incoming.get("code") || "");
      f.set("redirect_uri", EBAY_RUNAME);
    } else if (gt === "refresh_token") {
      f.set("grant_type", "refresh_token");
      f.set("refresh_token", incoming.get("refresh_token") || "");
      if (incoming.get("scope")) f.set("scope", incoming.get("scope"));
    } else if (gt === "client_credentials") {
      f.set("grant_type", "client_credentials");
      f.set("scope", incoming.get("scope") || "");
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "unsupported_grant_type" }));
    }

    const r = await fetch(TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " + Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString("base64"),
      },
      body: f.toString(),
    });

    const text = await r.text();
    res.statusCode = r.status;
    res.setHeader("Content-Type", "application/json");
    res.end(text);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "shim_error", detail: String(e) }));
  }
};
