# FieldProof

**Verified stablecoin reality for AI agents.**

FieldProof lets AI agents verify real-world stablecoin conditions through MiniPay users, using AI-checked evidence, Celo payouts, and onchain proof records.

Punchline:

> Every local claim becomes a paid proof. Every verified proof updates the Stablecoin Reality Index.

## What It Solves

Stablecoin adoption data is often too local, too offline, or too stale for AI agents and payment teams to trust. FieldProof creates a verified feed of real-world stablecoin conditions:

- USDT/USDm cash-out fees
- MiniPay merchant acceptance
- stablecoin-to-cash spreads
- local price benchmarks
- payment friction by city

## Current Build

The current build is a Celo-focused MVP with:

- Stablecoin Reality Index dashboard
- agent request composer
- MiniPay contributor proof flow
- local verifier API with onchain payout execution
- Celo proof registry view
- Recharts-powered city map and index analytics
- Solidity contracts for escrow and registry
- deploy scripts for Celo Sepolia and mainnet

Run locally:

```bash
npm install
npm start
```

Then open:

```txt
http://localhost:4173
```

The app runs a small Node server with API routes and serves the frontend from the same origin.

API routes:

```txt
GET  /api/health
GET  /api/config
GET  /api/state
POST /api/requests
POST /api/submissions
POST /api/reset
```

The browser flow now signs real Celo Sepolia transactions:

1. The requester approves test USDm spend.
2. The requester calls `FieldProofEscrow.createRequest(...)`.
3. The contributor calls `submitProof(...)` with an evidence hash.
4. The verifier backend calls `verifyProof(...)` and releases payout.
5. The backend publishes the accepted record to `FieldProofRegistry`.

## Project Structure

```txt
index.html                 Product app
styles.css                 Responsive interface styling
app.ts                     Typed frontend proof workflow
app.js                     Generated browser bundle after `npm run build`
contracts/FieldProofEscrow.sol
contracts/FieldProofRegistry.sol
server/index.ts
data/seed.json
docs/architecture.md
docs/demo-script.md
docs/continuation-checklist.md
docs/deployment.md
```

For the final submission narrative and video flow, use `docs/demo-script.md`.
For deployment tradeoffs, use `docs/deployment.md`.

## Celo Integration Plan

1. Deploy `FieldProofEscrow` on Celo Sepolia, then mainnet, with stablecoin reward support.
2. Deploy `FieldProofRegistry` for accepted proof results.
3. Use MiniPay/EIP-1193 auto-connect and Celo chain switching in the app.
4. Register the verifier agent with Celo agent identity infrastructure.
5. Replace local verifier rules with OCR/image verification and evidence storage.

## Current Celo Sepolia Deployment

- Deployer: `0x18883C2FF5a84b7F686FF0cfd400c6F3D6068b07`
- `FieldProofEscrow`: `0x469ddae654095bb0c086d2e3b240e06cfc360e95`
- `FieldProofRegistry`: `0x9830b6a837ca3a603611f944e9f70563159217be`
- Test USDm: `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`
- Explorer: `https://celo-sepolia.blockscout.com`

The requester wallet must hold test USDm before funding a request. Celo Sepolia also has cUSD, but Mento V3 currently exposes USDm more clearly for this test flow.

## Contract Commands

Compile:

```bash
npm run compile:contracts
```

Deploy to Celo Sepolia:

```bash
cp .env.example .env
# Fill PRIVATE_KEY, VERIFIER_ADDRESS, and PUBLISHER_ADDRESS
npm run deploy:celo
```

The Sepolia deploy writes public contract addresses to `deployments/celo-sepolia.json`.

Set `CELO_NETWORK=mainnet`, `CELO_RPC_URL=https://forno.celo.org`, and the Celo mainnet stable token address before deploying to mainnet.

Never commit funded private keys.
