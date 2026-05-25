import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  http,
  parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const rootDir = resolve(fileURLToPath(new URL("../", import.meta.url)));
const artifactsDir = join(rootDir, "artifacts");
const dataDir = join(rootDir, "data");
const statePath = join(dataDir, "state.json");
const seedPath = join(dataDir, "seed.json");
const port = Number(process.env.PORT || 4173);
const activeCeloNetwork = process.env.CELO_NETWORK === "mainnet" ? "mainnet" : "sepolia";
const celoSepoliaUsdm = "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const typeLabels = {
  cashout_fee: "Cash-out fee",
  merchant_acceptance: "Merchant acceptance",
  fx_spread: "Stablecoin-to-cash spread",
  local_price: "Local price benchmark",
};

const celoConfig = {
  chain: "celo",
  activeNetwork: activeCeloNetwork,
  mainnet: {
    chainId: 42220,
    chainIdHex: "0xa4ec",
    name: "Celo Mainnet",
    rpcUrl: "https://forno.celo.org",
    blockExplorer: "https://celoscan.io",
    stableToken: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    stableTokenSymbol: "cUSD",
    stableTokenDecimals: 18,
  },
  sepolia: {
    chainId: 11142220,
    chainIdHex: "0xaa044c",
    name: "Celo Sepolia",
    rpcUrl: process.env.CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org",
    blockExplorer: "https://celo-sepolia.blockscout.com",
    stableToken: process.env.STABLE_TOKEN_ADDRESS || celoSepoliaUsdm,
    stableTokenSymbol: process.env.STABLE_TOKEN_SYMBOL || "USDm",
    stableTokenDecimals: Number(process.env.STABLE_TOKEN_DECIMALS || 18),
  },
};

const celoMainnet = defineChain({
  id: 42220,
  name: "Celo",
  nativeCurrency: { decimals: 18, name: "CELO", symbol: "CELO" },
  rpcUrls: {
    default: { http: ["https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
});

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { decimals: 18, name: "CELO", symbol: "CELO" },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "Celo Sepolia Blockscout", url: "https://celo-sepolia.blockscout.com" },
  },
});

const activeChain = activeCeloNetwork === "mainnet" ? celoMainnet : celoSepolia;
const activeRpcUrl =
  activeCeloNetwork === "mainnet" ? celoConfig.mainnet.rpcUrl : celoConfig.sepolia.rpcUrl;
const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(activeRpcUrl),
});

async function readDeploymentArtifact() {
  const fileName = activeCeloNetwork === "mainnet" ? "mainnet.json" : "celo-sepolia.json";
  try {
    return JSON.parse(await readFile(join(rootDir, "deployments", fileName), "utf8"));
  } catch {
    return null;
  }
}

async function loadArtifact(name) {
  return JSON.parse(await readFile(join(artifactsDir, `${name}.json`), "utf8"));
}

function readPrivateKey() {
  const rawPrivateKey = process.env.PRIVATE_KEY?.trim();
  if (!rawPrivateKey) {
    return null;
  }

  const privateKey = rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("PRIVATE_KEY must be a 64-character hex key, with or without a 0x prefix.");
  }

  return privateKey as `0x${string}`;
}

function getVerifierWallet() {
  const privateKey = readPrivateKey();
  if (!privateKey) {
    return null;
  }

  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: activeChain,
    transport: http(activeRpcUrl),
  });
}

async function parseEscrowEvent(txHash, eventName) {
  const deployment = await readDeploymentArtifact();
  const escrowAddress = deployment?.contracts?.FieldProofEscrow?.address?.toLowerCase();
  if (!escrowAddress) {
    throw new Error("FieldProofEscrow deployment is missing.");
  }

  const artifact = await loadArtifact("FieldProofEscrow");
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const logs = parseEventLogs({
    abi: artifact.abi,
    eventName,
    logs: receipt.logs,
  });

  return logs.find((log) => log.address.toLowerCase() === escrowAddress);
}

async function runOnchainVerification({ request, submission, verification }) {
  const deployment = await readDeploymentArtifact();
  const wallet = getVerifierWallet();
  if (!deployment || !wallet) {
    return {};
  }

  const escrow = deployment.contracts.FieldProofEscrow.address;
  const registry = deployment.contracts.FieldProofRegistry.address;
  const escrowArtifact = await loadArtifact("FieldProofEscrow");
  const registryArtifact = await loadArtifact("FieldProofRegistry");
  const confidenceBps = Math.min(10_000, Math.round(verification.confidence * 100));
  const requestId = BigInt(request.contractRequestId);
  const submissionId = BigInt(submission.contractSubmissionId);

  const verifyHash = (await (wallet as any).sendTransaction({
    to: escrow,
    data: encodeFunctionData({
      abi: escrowArtifact.abi,
      functionName: "verifyProof",
      args: [requestId, submissionId, verification.accepted, confidenceBps],
    }),
  })) as `0x${string}`;
  await publicClient.waitForTransactionReceipt({ hash: verifyHash });

  let recordHash = null;
  if (verification.accepted) {
    const resultHash = fakeTxHash(`${request.id}-${submission.reportedValue}-result`);
    const recordHashTx = (await (wallet as any).sendTransaction({
      to: registry,
      data: encodeFunctionData({
        abi: registryArtifact.abi,
        functionName: "publishRecord",
        args: [
          requestId,
          resultHash,
          submission.evidenceHash,
          request.city,
          typeLabels[request.type] || request.type,
          submission.reportedValue,
          confidenceBps,
        ],
      }),
    })) as `0x${string}`;
    await publicClient.waitForTransactionReceipt({ hash: recordHashTx });
    recordHash = recordHashTx;
  }

  return {
    payoutTx: verifyHash,
    recordTx: recordHash,
  };
}

async function ensureStateFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await access(statePath);
  } catch {
    await copyFile(seedPath, statePath);
  }
}

async function readState() {
  await ensureStateFile();
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function writeState(state) {
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error("Request body too large");
    }
  }
  return body ? JSON.parse(body) : {};
}

function fakeTxHash(input) {
  return `0x${createHash("sha256").update(input).digest("hex")}`;
}

function verifySubmission({ request, reportedValue = "", evidenceType = "", localNote = "" }) {
  const text = `${reportedValue} ${evidenceType} ${localNote}`.toLowerCase();
  const checks = [
    {
      label: "Evidence relevance",
      passed:
        text.includes("fee") ||
        text.includes("receipt") ||
        text.includes("merchant") ||
        text.includes("spread") ||
        text.includes("price"),
      detail: "Submission matches stablecoin reality request category",
    },
    {
      label: "Celo asset",
      passed:
        request.asset === "USDm" ||
        request.asset === "cUSD" ||
        request.asset === "USDC" ||
        request.asset === "USDT",
      detail: `${request.asset || celoConfig.sepolia.stableTokenSymbol} reward rail`,
    },
    {
      label: "Location scope",
      passed: Boolean(request.city),
      detail: `${request.city} proof market`,
    },
    {
      label: "Value extraction",
      passed: /[0-9]/.test(reportedValue),
      detail: reportedValue || "No value detected",
    },
    {
      label: "Duplicate risk",
      passed: true,
      detail: "Evidence hash is unique in this local run",
    },
  ];
  const passed = checks.filter((check) => check.passed).length;
  const confidence = Math.min(96, 72 + passed * 5 + (reportedValue.includes("%") ? 4 : 0));

  return {
    accepted: confidence >= 86,
    confidence,
    checks,
    reason:
      confidence >= 86
        ? "Evidence passed FieldProof verifier rules and can trigger Celo payout."
        : "Evidence needs manual review before payout.",
  };
}

function updateIndex(state, request, reportedValue, confidence) {
  const signal = typeLabels[request.type] || request.type;
  const existing = state.index.find((row) => row.city === request.city && row.signal === signal);
  if (existing) {
    existing.value = reportedValue;
    existing.confidence = confidence;
    existing.status = "verified";
    return;
  }
  state.index.unshift({
    city: request.city,
    signal,
    value: reportedValue,
    confidence,
    status: "verified",
  });
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      app: "FieldProof",
      chain: "celo",
      minipayReady: true,
    });
    return true;
  }

  if (url.pathname === "/api/config") {
    sendJson(res, 200, {
      ...celoConfig,
      deployment: await readDeploymentArtifact(),
    });
    return true;
  }

  if (url.pathname === "/api/state" && req.method === "GET") {
    sendJson(res, 200, await readState());
    return true;
  }

  if (url.pathname === "/api/reset" && req.method === "POST") {
    await copyFile(seedPath, statePath);
    sendJson(res, 200, await readState());
    return true;
  }

  if (url.pathname === "/api/requests" && req.method === "POST") {
    const body = await readBody(req);
    const reward = Number(body.reward || 0.8);
    const confirmations = Number(body.confirmations || 3);
    let contractRequestId = null;
    let escrowTx = body.escrowTx;

    if (body.mode === "onchain" && body.escrowTx) {
      const event = await parseEscrowEvent(body.escrowTx, "ProofRequestCreated");
      if (!event) {
        sendJson(res, 422, { error: "ProofRequestCreated event not found for escrow transaction." });
        return true;
      }
      contractRequestId = (event as any).args.requestId.toString();
    }

    const request = {
      id: contractRequestId ? `fp-req-${contractRequestId}` : `fp-req-${Date.now().toString(36)}`,
      question: String(body.question || "").trim(),
      type: body.proofType || body.type || "cashout_fee",
      city: body.city || "Lagos",
      reward,
      confirmations,
      funded: Number((reward * confirmations).toFixed(2)),
      status: "collecting",
      created: "now",
      chain: "celo",
      asset: body.asset || celoConfig.sepolia.stableTokenSymbol,
      requester: body.requester || null,
      contractRequestId,
      metadataHash: body.metadataHash || null,
      escrowTx: escrowTx || fakeTxHash(`${body.question}-${Date.now()}-escrow`),
    };
    const state = await readState();
    state.requests.unshift(request);
    await writeState(state);
    sendJson(res, 201, { request, state });
    return true;
  }

  if (url.pathname === "/api/submissions" && req.method === "POST") {
    const body = await readBody(req);
    const state = await readState();
    const request = state.requests.find((item) => item.id === body.requestId);
    if (!request) {
      sendJson(res, 404, { error: "Proof request not found" });
      return true;
    }

    const evidenceHash = body.evidenceHash || fakeTxHash(`${request.id}-${body.reportedValue}-${body.localNote}`);
    const verification = verifySubmission({
      request,
      reportedValue: body.reportedValue,
      evidenceType: body.evidenceType,
      localNote: body.localNote,
    });
    let contractSubmissionId = null;
    let onchainTxs: { payoutTx?: string; recordTx?: string | null } = {};

    if (body.submissionTx && request.contractRequestId) {
      const event = await parseEscrowEvent(body.submissionTx, "ProofSubmitted");
      if (!event) {
        sendJson(res, 422, { error: "ProofSubmitted event not found for submission transaction." });
        return true;
      }
      contractSubmissionId = (event as any).args.submissionId.toString();
    }

    const submission = {
      id: contractSubmissionId ? `sub-${request.contractRequestId}-${contractSubmissionId}` : `sub-${randomUUID().slice(0, 8)}`,
      requestId: request.id,
      contributor: body.contributor || "minipay-demo-user",
      contractSubmissionId,
      reportedValue: body.reportedValue || "",
      evidenceType: body.evidenceType || "Receipt photo",
      localNote: body.localNote || "",
      evidenceHash,
      submissionTx: body.submissionTx || null,
      status: verification.accepted ? "accepted" : "review",
      verification,
      createdAt: new Date().toISOString(),
    };
    state.submissions.unshift(submission);

    let record = null;
    if (verification.accepted) {
      if (body.submissionTx && request.contractRequestId && contractSubmissionId) {
        onchainTxs = await runOnchainVerification({ request, submission, verification });
      }

      const payoutTx = onchainTxs.payoutTx || fakeTxHash(`${submission.id}-celo-payout`);
      const recordTx = onchainTxs.recordTx || fakeTxHash(`${submission.id}-registry`);
      record = {
        id: `proof-${randomUUID().slice(0, 5)}`,
        title: `${request.city} ${typeLabels[request.type] || request.type} verified`,
        result: `${submission.reportedValue}, accepted by FieldProof verifier`,
        confidence: verification.confidence,
        payout: `${request.reward.toFixed(2)} ${request.asset || celoConfig.sepolia.stableTokenSymbol}`,
        tx: payoutTx,
        chain: "celo",
        recordTx,
        evidenceHash,
        contractRequestId: request.contractRequestId || null,
        contractSubmissionId,
      };
      state.records.unshift(record);
      updateIndex(state, request, submission.reportedValue, verification.confidence);
    }

    await writeState(state);
    sendJson(res, 201, { submission, record, state });
    return true;
  }

  return false;
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(rootDir, normalized));
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `localhost:${port}`}`);
    if (url.pathname.startsWith("/api/") && (await handleApi(req, res, url))) {
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`FieldProof Celo app running at http://localhost:${port}`);
});
