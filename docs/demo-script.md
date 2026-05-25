# FieldProof Demo Script

## One-Line Pitch

FieldProof is verified stablecoin reality for AI agents: agents fund local proof requests, MiniPay users submit evidence, the verifier pays accepted contributors on Celo, and the Stablecoin Reality Index updates.

## Problem

Stablecoin dashboards can show onchain volume, but they do not show what users experience on the ground. An AI agent cannot know today's local cash-out fee, whether a merchant really accepts MiniPay, or the spread a user is offered in a city unless a trusted local person verifies it.

## Demo Question

> What is the real fee to cash out 20 USDT in Lagos today?

## Demo Flow

1. Open the FieldProof dashboard and show the Stablecoin Reality Index.
2. In the agent console, create a Lagos cash-out fee request.
3. Fund the request with test USDm on Celo Sepolia.
4. Switch to the MiniPay contributor view and submit evidence.
5. The verifier checks the evidence and confidence score.
6. FieldProof releases the contributor payout through `FieldProofEscrow`.
7. FieldProof publishes the accepted result through `FieldProofRegistry`.
8. The registry view shows payout, registry, and evidence hash links.

## Current Sepolia Test Loop

- Request id: `1`
- Proof submission id: `1`
- Escrow funding tx: `0x0a158030aaade1b6a432145b63795577dd2c640dc31aaed86b8bcca00a8335cc`
- Proof submission tx: `0xe6e6d041e7c4ae9d26ca1bb5bc3f48dec2c1e26d9f0043a7fcb5ae132901fd0e`
- Payout tx: `0x208b8bfb8669e9c1c431aac8fc53c8f8c80fe8374226ce7ebf56ff9a908b99a5`
- Registry publish tx: `0x8d1665ab140bf33b64e18747850ad5712d2ca1f8cb07b601752ade4280a79979`
- Evidence hash: `0x0c2eaa912da3e5b0d9909e772cbc69b12da1508df184c39d16c54ca6822549f4`

Explorer: `https://celo-sepolia.blockscout.com`

## Why Celo

FieldProof needs low-cost stablecoin payouts, mobile wallet UX, and fast settlement for small local proof jobs. Celo plus MiniPay makes the reward flow feel like a normal mobile payment while still producing public proof objects for agents and payment teams.

## What To Say In The Video

> FieldProof asks the question that onchain data alone cannot answer: what does using stablecoins actually cost on the ground? Here an AI agent funds a Lagos cash-out fee request with USDm on Celo Sepolia. A MiniPay-style contributor submits evidence. The verifier scores it, releases payment from escrow, publishes the result to the registry, and the Stablecoin Reality Index updates. The result is not just a task completion. It is a machine-readable local proof that AI agents can consume.

## Submission Emphasis

- Do not pitch FieldProof as a generic task marketplace.
- Pitch it as a stablecoin reality oracle for AI agents.
- Show the live Celo transaction trail early.
- Keep the demo centered on one memorable question: the real cost of cashing out stablecoins in Lagos.
