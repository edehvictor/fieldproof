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

## MVP Demo

The current build is a polished static product MVP with:

- Stablecoin Reality Index dashboard
- agent request composer
- MiniPay contributor proof flow
- AI verifier simulation
- Celo proof registry view
- Solidity contract stubs for escrow and registry

Run locally:

```bash
npm start
```

Then open:

```txt
http://localhost:4173
```

You can also open `index.html` directly in a browser.

## Project Structure

```txt
index.html                 Product app
styles.css                 Responsive interface styling
app.js                     Demo state and proof workflow
contracts/FieldProofEscrow.sol
contracts/FieldProofRegistry.sol
docs/architecture.md
```

## Celo Integration Plan

1. Deploy `FieldProofEscrow` on Celo mainnet with cUSD/USDT/USDC reward support.
2. Deploy `FieldProofRegistry` for accepted proof results.
3. Add MiniPay wallet connection and stablecoin payment flow.
4. Register the verifier agent with Celo agent identity infrastructure.
5. Expose agent endpoints for creating proof requests and querying the Stablecoin Reality Index.
