# FieldProof Continuation Checklist

Use this checklist to keep the next build session focused on Celo execution.

## Next Milestone

Deploy FieldProof contracts to a Celo testnet and replace simulated proof transactions with real contract calls.

## Immediate Tasks

- Choose the active Celo testnet for deployment.
- Create a fresh FieldProof deployer wallet.
- Fund the deployer wallet with test CELO.
- Add local `.env` values without committing secrets.
- Run `npm run compile:contracts`.
- Run `npm run deploy:celo`.
- Save deployed contract addresses in `deployments/`.
- Wire request funding to `FieldProofEscrow`.
- Wire proof submission to `submitProof`.
- Wire verifier approval to `verifyProof`.
- Publish accepted proof records through `FieldProofRegistry`.

## Submission Focus

Keep the product story narrow:

> FieldProof verifies real-world stablecoin conditions for AI agents using MiniPay users, Celo payouts, and onchain proof records.
