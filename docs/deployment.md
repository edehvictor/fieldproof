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

## Mainnet Proof of Ship Path

Talent's Celo Proof of Ship criteria require a MiniPay-compatible app and smart contracts deployed on Celo mainnet.

Use this order:

1. Create or choose a deployer wallet that can safely deploy to Celo mainnet.
2. Fund it with a small amount of mainnet CELO for gas.
3. Set local `.env` for mainnet:

```bash
CELO_NETWORK=mainnet
CELO_RPC_URL=https://forno.celo.org
PRIVATE_KEY=...
VERIFIER_ADDRESS=your_mainnet_wallet
PUBLISHER_ADDRESS=your_mainnet_wallet
STABLE_TOKEN_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
STABLE_TOKEN_SYMBOL=cUSD
STABLE_TOKEN_DECIMALS=18
```

4. Compile and deploy:

```bash
npm run compile:contracts
npm run deploy:celo
```

5. Commit `deployments/mainnet.json`.
6. Deploy the app host with the same mainnet env vars.
7. Open the hosted app in MetaMask or MiniPay, connect wallet, and create one small funded request.
8. Submit one proof so the registry shows a real mainnet proof loop.

Do not publish a private key. Only submit public contract addresses and transaction links.

## Vercel Caveat

Do not deploy this repo to Vercel as-is for the live hackathon demo. Vercel can serve the frontend, but the current API server is not packaged as Vercel serverless functions and local file state is not durable there.

To make Vercel production-ready, convert the API routes to `/api/*` serverless handlers and move state to Supabase, Neon, or another hosted database.

## MiniPay / Wallet Testing

MiniPay and MetaMask only appear when the browser injects an EIP-1193 provider at `window.ethereum`.

For desktop testing, open the deployed URL in a browser with MetaMask or Brave Wallet enabled.

For MiniPay testing, open the deployed HTTPS URL inside MiniPay / Opera Mini's MiniPay environment.
