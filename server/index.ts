import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("../", import.meta.url)));
const dataDir = join(rootDir, "data");
const statePath = join(dataDir, "state.json");
const seedPath = join(dataDir, "seed.json");
const port = Number(process.env.PORT || 4173);

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
  mainnet: {
    chainId: 42220,
    chainIdHex: "0xa4ec",
    name: "Celo Mainnet",
    rpcUrl: "https://forno.celo.org",
    blockExplorer: "https://celoscan.io",
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  },
  alfajores: {
    chainId: 44787,
    chainIdHex: "0xaef3",
    name: "Celo Alfajores",
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
    cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  },
};

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
      passed: request.asset === "cUSD" || request.asset === "USDC" || request.asset === "USDT",
      detail: `${request.asset || "cUSD"} reward rail`,
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
    sendJson(res, 200, celoConfig);
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
    const request = {
      id: `fp-req-${Date.now().toString(36)}`,
      question: String(body.question || "").trim(),
      type: body.proofType || body.type || "cashout_fee",
      city: body.city || "Lagos",
      reward,
      confirmations,
      funded: Number((reward * confirmations).toFixed(2)),
      status: "collecting",
      created: "now",
      chain: "celo",
      asset: "cUSD",
      escrowTx: fakeTxHash(`${body.question}-${Date.now()}-escrow`),
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

    const evidenceHash = fakeTxHash(`${request.id}-${body.reportedValue}-${body.localNote}`);
    const verification = verifySubmission({
      request,
      reportedValue: body.reportedValue,
      evidenceType: body.evidenceType,
      localNote: body.localNote,
    });
    const submission = {
      id: `sub-${randomUUID().slice(0, 8)}`,
      requestId: request.id,
      contributor: body.contributor || "minipay-demo-user",
      reportedValue: body.reportedValue || "",
      evidenceType: body.evidenceType || "Receipt photo",
      localNote: body.localNote || "",
      evidenceHash,
      status: verification.accepted ? "accepted" : "review",
      verification,
      createdAt: new Date().toISOString(),
    };
    state.submissions.unshift(submission);

    let record = null;
    if (verification.accepted) {
      const payoutTx = fakeTxHash(`${submission.id}-celo-payout`);
      const recordTx = fakeTxHash(`${submission.id}-registry`);
      record = {
        id: `proof-${randomUUID().slice(0, 5)}`,
        title: `${request.city} ${typeLabels[request.type] || request.type} verified`,
        result: `${submission.reportedValue}, accepted by FieldProof verifier`,
        confidence: verification.confidence,
        payout: `${request.reward.toFixed(2)} cUSD`,
        tx: payoutTx,
        chain: "celo",
        recordTx,
        evidenceHash,
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
