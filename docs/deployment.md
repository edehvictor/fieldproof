# FieldProof Deployment Note

## Recommended Tonight

Deploy FieldProof to a Node-capable host such as Render, Railway, Fly.io, or a small VPS.

Reason: the current MVP uses one Node server for both the frontend and API routes, and it keeps hackathon demo state in `data/state.json`.

Use:

```bash
npm install
npm start
```

The host must provide:

- Node 20+
- the `.env` values used by the verifier wallet
- HTTPS, so injected wallets can interact safely

## Vercel Caveat

Do not deploy this repo to Vercel as-is for the live hackathon demo. Vercel can serve the frontend, but the current API server is not packaged as Vercel serverless functions and local file state is not durable there.

To make Vercel production-ready, convert the API routes to `/api/*` serverless handlers and move state to Supabase, Neon, or another hosted database.

## MiniPay / Wallet Testing

MiniPay and MetaMask only appear when the browser injects an EIP-1193 provider at `window.ethereum`.

For desktop testing, open the deployed URL in a browser with MetaMask or Brave Wallet enabled.

For MiniPay testing, open the deployed HTTPS URL inside MiniPay / Opera Mini's MiniPay environment.
