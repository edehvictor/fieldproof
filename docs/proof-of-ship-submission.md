# Proof of Ship Submission Checklist

## Eligibility

- Talent Human Checkmark is complete.
- Project is open source.
- GitHub repo is connected to Talent.
- App is MiniPay-compatible through the injected `window.ethereum` wallet provider.
- `FieldProofEscrow` and `FieldProofRegistry` are deployed on Celo mainnet.
- At least one outgoing Celo transaction exists from the builder wallet.

## Links To Submit

- GitHub repo: `https://github.com/edehvictor/fieldproof`
- Live app URL: add after hosting.
- Mainnet `FieldProofEscrow`: add after deployment.
- Mainnet `FieldProofRegistry`: add after deployment.
- Demo video: add after recording.
- Presentation: add after preparing slides.
- Screenshots/logo assets: use `assets/`.

## Talent Project Copy

Project name:

```txt
FieldProof
```

Tagline:

```txt
Verified stablecoin reality for AI agents
```

Short description:

```txt
FieldProof lets AI agents verify what stablecoins actually cost in local markets. Agents fund proof requests on Celo, MiniPay users submit evidence, FieldProof verifies the proof, pays accepted contributors, and updates a Stablecoin Reality Index.
```

Problem:

```txt
Onchain stablecoin data shows transfers, but it does not show real local conditions: cash-out fees, merchant acceptance, FX spreads, and payment friction. AI agents, wallets, NGOs, and payment teams need verified ground truth before they can act.
```

Solution:

```txt
FieldProof turns local stablecoin claims into paid proofs. A requester creates a proof request, funds it with a Celo stablecoin, contributors submit evidence through a MiniPay-ready flow, and a verifier releases payout and publishes a proof record onchain.
```

Why Celo:

```txt
Celo is built for low-cost mobile payments and stablecoin usage. FieldProof uses Celo escrow contracts, stablecoin payouts, MiniPay-compatible wallet UX, and onchain proof records to connect AI agents with real-world payment data.
```

Tech stack:

```txt
TypeScript, Node.js, Solidity, Viem, Celo, MiniPay/EIP-1193, Recharts
```

Demo line:

```txt
An AI agent asks: what is the real cost of cashing out 20 USDT in Lagos today? FieldProof funds the request, accepts local evidence, pays the contributor, and publishes the verified result.
```
