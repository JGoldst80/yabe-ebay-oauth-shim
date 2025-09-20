# YABE eBay OAuth Shim (Vercel)

This is a tiny serverless proxy so a ChatGPT Action can authorize with eBay SELL APIs,
which require `redirect_uri` = your **RuName**.

## Endpoints
- `api/ebay-oauth/authorize` — redirects to eBay with your RuName.
- `api/ebay-oauth/token` — exchanges code/refresh/client_credentials for tokens.

## Environment variables (set in Vercel → Project Settings → Environment Variables)
- `EBAY_ENV` = `prod`                  # use `sandbox` only if testing sandbox
- `EBAY_CLIENT_ID` = your eBay App ID
- `EBAY_CLIENT_SECRET` = your eBay Cert ID (client secret)
- `EBAY_RUNAME` = your exact RuName

## Deploy
1. Create a new GitHub repo and upload this folder (keep the `api/` structure).
2. In Vercel, **Import Project** from that repo.
3. Set env variables and **Deploy**.

## Test (optional)
- Visit: `https://<vercel-domain>/api/ebay-oauth/authorize?scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope&state=ping`
- Curl:  `curl -sS -X POST https://<vercel-domain>/api/ebay-oauth/token -H 'Content-Type: application/x-www-form-urlencoded' --data 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope'`


Small update to trigger redeploy.
