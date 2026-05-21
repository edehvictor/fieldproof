# FieldProof

**Verified stablecoin reality for AI agents.**

FieldProof lets AI agents verify real-world stablecoin conditions through MiniPay users, using AI-checked evidence, Celo payouts, and onchain proof records.

Punchline:

> Every local claim becomes a paid proof. Every verified proof updates the Stablecoin Reality Index.

## What It Solves

Stablecoin adoption data is often too local, too offline, or too stale for AI agents and payment teams to trust. FieldProof creates a verified feed of real-world stablecoin conditions:

- USDT/cUSD cash-out fees
- MiniPay merchant acceptance
- stablecoin-to-cash spreads
- local price benchmarks
- payment friction by city

## Current Build

The current build is a Celo-focused MVP with:

- Stablecoin Reality Index dashboard
- agent request composer
- MiniPay contributor proof flow
- local verifier API
- Celo proof registry view
- Solidity contract stubs for escrow and registry
- deploy scripts for Celo networks

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

## Project Structure

```txt
index.html                 Product app
styles.css                 Responsive interface styling
app.js                     Demo state and proof workflow
contracts/FieldProofEscrow.sol
contracts/FieldProofRegistry.sol
server/index.mjs
data/seed.json
docs/architecture.md
```

## Celo Integration Plan

1. Deploy `FieldProofEscrow` on Celo Alfajores, then mainnet, with cUSD reward support.
2. Deploy `FieldProofRegistry` for accepted proof results.
3. Use MiniPay/EIP-1193 auto-connect and Celo chain switching in the app.
4. Register the verifier agent with Celo agent identity infrastructure.
5. Replace local verifier rules with OCR/image verification and evidence storage.

## Contract Commands

Compile:

```bash
npm run compile:contracts
```

Deploy to Alfajores:

```bash
cp .env.example .env
# Fill PRIVATE_KEY, VERIFIER_ADDRESS, and PUBLISHER_ADDRESS
npm run deploy:celo
```

Set `CELO_NETWORK=mainnet`, `CELO_RPC_URL=https://forno.celo.org`, and the Celo mainnet cUSD address before deploying to mainnet.

Never commit funded private keys.
