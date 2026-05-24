# FieldProof Architecture

FieldProof is a stablecoin reality oracle for AI agents. The MVP is intentionally narrow: it verifies local stablecoin conditions such as cash-out fees, MiniPay merchant acceptance, stablecoin-to-cash spreads, and one local price benchmark.

## System Surfaces

- Agent console: creates structured proof requests from market questions.
- MiniPay contributor flow: lets local users submit evidence and receive cUSD rewards.
- AI verifier: currently a local deterministic verifier API, designed to be replaced by OCR/image/location checks.
- Celo contracts: escrow stablecoin rewards and publish accepted proof records.
- Stablecoin Reality Index: public dashboard and API-ready output for agents.

## Proof Lifecycle

1. An agent asks a local stablecoin question.
2. FieldProof creates request metadata and funds the reward pool in cUSD.
3. MiniPay users submit photo, receipt, location, timestamp, and typed values.
4. The verifier API checks evidence and emits a confidence score.
5. The escrow releases payouts to accepted contributors.
6. The registry publishes the verified result as an onchain proof record.

## MVP Contract Boundary

`FieldProofEscrow.sol` handles request funding, proof submission references, approval/rejection, contributor payouts, and expired refunds.

`FieldProofRegistry.sol` publishes the accepted proof result hash, evidence bundle hash, city, signal, verified value, and confidence score.

Raw media should live in object storage. Onchain storage keeps hashes and concise proof metadata.

## Backend API

The MVP uses `server/index.ts` as a zero-framework Node API:

- `GET /api/state`: returns requests, submissions, proof records, and index values.
- `POST /api/requests`: creates a Celo-funded proof request object.
- `POST /api/submissions`: runs verifier rules, records submission metadata, and updates the index on accepted proof.
- `GET /api/config`: returns Celo mainnet and Alfajores chain config for MiniPay/EIP-1193 clients.

The local state lives in `data/state.json`, copied from `data/seed.json` when missing.

## MiniPay / Celo Client

The frontend auto-detects `window.ethereum`, switches/adds Celo Mainnet when possible, and shows a MiniPay wallet status in the header. Local desktop browsers fall back to demo mode; MiniPay should use the injected EIP-1193 provider.

Supported Celo defaults:

- Celo Mainnet chain id: `42220` / `0xa4ec`
- Alfajores chain id: `44787` / `0xaef3`
- Mainnet cUSD: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- Alfajores cUSD: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

## Hackathon Demo

Demo question:

> What is the real cost of cashing out 20 USDT in Lagos today?

Winning demo path:

1. Agent creates a cash-out fee proof request.
2. Reward pool is funded.
3. MiniPay contributor submits local evidence.
4. AI verifier accepts proof with a confidence score.
5. Contributor payout appears in the registry.
6. Stablecoin Reality Index updates with the verified value.
