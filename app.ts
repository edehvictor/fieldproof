export {};

type ProofType = "cashout_fee" | "merchant_acceptance" | "fx_spread" | "local_price";
type ProofStatus = "collecting" | "verified" | "review" | "rejected";
type IndexStatus = "verified" | "review" | "rejected";
type TrendKey = "lagos" | "accra" | "nairobi";

interface ProofRequest {
  id: string;
  question: string;
  type: ProofType | string;
  city: string;
  reward: number;
  confirmations: number;
  funded: number;
  status: ProofStatus | string;
  created: string;
  chain?: "celo";
  asset?: string;
  escrowTx?: string;
}

interface IndexRow {
  city: string;
  signal: string;
  value: string;
  confidence: number;
  status: IndexStatus;
}

interface ProofRecord {
  id: string;
  title: string;
  result: string;
  confidence: number;
  payout: string;
  tx: string;
  chain?: "celo";
  recordTx?: string;
  evidenceHash?: string;
}

interface Submission {
  id: string;
  requestId: string;
}

interface TrendRow {
  day: string;
  lagos: number;
  accra: number;
  nairobi: number;
}

interface FieldProofState {
  requests: ProofRequest[];
  index: IndexRow[];
  records: ProofRecord[];
  submissions?: Submission[];
  trend: TrendRow[];
}

interface CeloNetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  stableToken: string;
  stableTokenSymbol: string;
}

interface CeloDeploymentContract {
  address: string;
  transactionHash: string;
}

interface CeloDeployment {
  network: string;
  chainId: number;
  deployer: string;
  contracts: {
    FieldProofEscrow: CeloDeploymentContract;
    FieldProofRegistry: CeloDeploymentContract;
  };
  blockExplorer: string;
}

interface CeloConfig {
  activeNetwork: "sepolia" | "mainnet";
  mainnet: CeloNetworkConfig;
  sepolia: CeloNetworkConfig;
  deployment?: CeloDeployment | null;
}

interface EthereumProvider {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
}

interface CreateRequestResponse {
  request: ProofRequest;
  state: FieldProofState;
}

interface VerificationCheck {
  label: string;
  detail: string;
}

interface SubmissionResponse {
  submission: Submission & {
    verification: {
      accepted: boolean;
      confidence: number;
      checks: VerificationCheck[];
    };
  };
  record?: ProofRecord;
  state: FieldProofState;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function mustQuery<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required DOM element: ${selector}`);
  }
  return element;
}

let state: FieldProofState = {
  requests: [
    {
      id: "fp-req-1042",
      question: "What is the real fee to cash out 20 USDT in Lagos today?",
      type: "cashout_fee",
      city: "Lagos",
      reward: 0.8,
      confirmations: 3,
      funded: 2.4,
      status: "collecting",
      created: "8 min ago",
    },
    {
      id: "fp-req-1039",
      question: "Which merchants near Osu accept MiniPay for small purchases?",
      type: "merchant_acceptance",
      city: "Accra",
      reward: 0.6,
      confirmations: 4,
      funded: 2.4,
      status: "collecting",
      created: "22 min ago",
    },
    {
      id: "fp-req-1034",
      question: "What spread is offered for cUSD to local cash in Nairobi?",
      type: "fx_spread",
      city: "Nairobi",
      reward: 0.7,
      confirmations: 3,
      funded: 2.1,
      status: "verified",
      created: "41 min ago",
    },
  ],
  index: [
    {
      city: "Lagos",
      signal: "USDT cash-out fee",
      value: "3.8%",
      confidence: 91,
      status: "verified",
    },
    {
      city: "Abuja",
      signal: "cUSD cash-out fee",
      value: "3.4%",
      confidence: 84,
      status: "review",
    },
    {
      city: "Accra",
      signal: "MiniPay merchant acceptance",
      value: "58%",
      confidence: 87,
      status: "verified",
    },
    {
      city: "Nairobi",
      signal: "Stablecoin-to-cash spread",
      value: "2.1%",
      confidence: 90,
      status: "verified",
    },
  ],
  records: [
    {
      id: "proof-88d21",
      title: "Lagos USDT cash-out fee verified",
      result: "3.8% fee on 20 USDT, confirmed by 3 contributors",
      confidence: 91,
      payout: "2.40 cUSD",
      tx: "0x9b21b337c0e4a11df21e91c64f12d9a3fc220d1e4b6f177bc92e44b6f0a88219",
    },
    {
      id: "proof-77a03",
      title: "Accra MiniPay acceptance sample",
      result: "7 of 12 checked merchants accepted MiniPay",
      confidence: 87,
      payout: "2.40 cUSD",
      tx: "0x4f172d08b9e0ca8838b932ce6dbf824d4e54b93335e603f7ce7306df8db0a549",
    },
  ],
  trend: [
    { day: "D-30", lagos: 2.7, accra: 2.4, nairobi: 1.9 },
    { day: "D-24", lagos: 2.9, accra: 2.5, nairobi: 2.0 },
    { day: "D-18", lagos: 3.1, accra: 2.7, nairobi: 1.8 },
    { day: "D-12", lagos: 3.0, accra: 2.8, nairobi: 1.9 },
    { day: "D-06", lagos: 3.5, accra: 2.9, nairobi: 2.0 },
    { day: "NOW", lagos: 3.8, accra: 2.9, nairobi: 2.1 },
  ],
};

let celoRuntimeConfig: CeloConfig | null = null;

const typeLabels: Record<string, string> = {
  cashout_fee: "Cash-out fee",
  merchant_acceptance: "Merchant acceptance",
  fx_spread: "Stablecoin-to-cash spread",
  local_price: "Local price benchmark",
};

const citySignals: Record<string, { fee: string; acceptance: string; latest: string }> = {
  Lagos: {
    fee: "3.8%",
    acceptance: "64%",
    latest: "4 min ago",
  },
  Abuja: {
    fee: "3.4%",
    acceptance: "51%",
    latest: "12 min ago",
  },
  Accra: {
    fee: "2.9%",
    acceptance: "58%",
    latest: "9 min ago",
  },
  Nairobi: {
    fee: "2.1%",
    acceptance: "69%",
    latest: "18 min ago",
  },
};

const els = {
  tabs: [...document.querySelectorAll<HTMLButtonElement>(".nav-tab")],
  panels: [...document.querySelectorAll<HTMLElement>(".view-section")],
  requestForm: mustQuery<HTMLFormElement>("#requestForm"),
  agentPayload: mustQuery<HTMLPreElement>("#agentPayload"),
  agentQuestion: mustQuery<HTMLTextAreaElement>("#agentQuestion"),
  proofType: mustQuery<HTMLSelectElement>("#proofType"),
  city: mustQuery<HTMLSelectElement>("#city"),
  reward: mustQuery<HTMLInputElement>("#reward"),
  confirmations: mustQuery<HTMLInputElement>("#confirmations"),
  indexRows: mustQuery<HTMLTableSectionElement>("#indexRows"),
  taskFeed: mustQuery<HTMLElement>("#taskFeed"),
  submissionRequest: mustQuery<HTMLSelectElement>("#submissionRequest"),
  submissionForm: mustQuery<HTMLFormElement>("#submissionForm"),
  verifierTitle: mustQuery<HTMLElement>("#verifierTitle"),
  verifierChecks: mustQuery<HTMLUListElement>("#verifierChecks"),
  scoreRing: mustQuery<HTMLElement>("#scoreRing"),
  proofRecords: mustQuery<HTMLElement>("#proofRecords"),
  contractNetwork: mustQuery<HTMLElement>("#contractNetwork"),
  escrowAddress: mustQuery<HTMLElement>("#escrowAddress"),
  registryAddress: mustQuery<HTMLElement>("#registryAddress"),
  escrowExplorer: mustQuery<HTMLAnchorElement>("#escrowExplorer"),
  registryExplorer: mustQuery<HTMLAnchorElement>("#registryExplorer"),
  avgFee: mustQuery<HTMLElement>("#avgFee"),
  avgConfidence: mustQuery<HTMLElement>("#avgConfidence"),
  totalPayouts: mustQuery<HTMLElement>("#totalPayouts"),
  cityDetail: mustQuery<HTMLElement>("#cityDetail"),
  realityChart: mustQuery<SVGSVGElement>("#realityChart"),
  walletStatus: mustQuery<HTMLElement>("#walletStatus"),
};

const celoSepolia = {
  chainId: "0xaa044c",
  chainName: "Celo Sepolia",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org"],
  blockExplorerUrls: ["https://celo-sepolia.blockscout.com"],
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function loadRemoteState() {
  try {
    state = await apiRequest<FieldProofState>("/api/state");
  } catch (error) {
    console.warn("Using local demo state because API is unavailable.", error);
  }
}

async function loadCeloConfig() {
  try {
    celoRuntimeConfig = await apiRequest<CeloConfig>("/api/config");
  } catch (error) {
    console.warn("Using local Celo config because API is unavailable.", error);
  }
}

function setWalletStatus(text: string) {
  if (els.walletStatus) {
    els.walletStatus.textContent = text;
  }
}

function formatAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Pending";
}

function renderCeloContracts() {
  const network = celoRuntimeConfig?.activeNetwork || "sepolia";
  const networkConfig = celoRuntimeConfig?.[network];
  const deployment = celoRuntimeConfig?.deployment;
  const explorer = deployment?.blockExplorer || networkConfig?.blockExplorer || "https://celo-sepolia.blockscout.com";
  const escrow = deployment?.contracts.FieldProofEscrow.address;
  const registry = deployment?.contracts.FieldProofRegistry.address;

  els.contractNetwork.textContent = networkConfig?.name || "Celo Sepolia";
  els.escrowAddress.textContent = formatAddress(escrow);
  els.registryAddress.textContent = formatAddress(registry);
  els.escrowAddress.title = escrow || "";
  els.registryAddress.title = registry || "";
  els.escrowExplorer.href = escrow ? `${explorer}/address/${escrow}` : explorer;
  els.registryExplorer.href = registry ? `${explorer}/address/${registry}` : explorer;
}

async function initMiniPayWallet() {
  const provider = window.ethereum;
  if (!provider) {
    setWalletStatus("MiniPay demo mode");
    return;
  }

  try {
    const chainId = await provider.request({ method: "eth_chainId" });
    if (chainId !== celoSepolia.chainId) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: celoSepolia.chainId }],
        });
      } catch (switchError) {
        if (
          typeof switchError === "object" &&
          switchError !== null &&
          "code" in switchError &&
          switchError.code === 4902
        ) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [celoSepolia],
          });
        } else {
          throw switchError;
        }
      }
    }
    const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
    const account = accounts?.[0];
    setWalletStatus(account ? `Sepolia ${account.slice(0, 6)}...${account.slice(-4)}` : "Celo Sepolia ready");
  } catch (error) {
    setWalletStatus("MiniPay permission needed");
    console.warn("MiniPay/Celo wallet connection was not completed.", error);
  }
}

function formatPayload() {
  const payload = {
    agent: "fieldproof-verifier.celo",
    question: els.agentQuestion.value.trim(),
    proofType: els.proofType.value,
    city: els.city.value,
    asset: "cUSD",
    rewardPerProof: Number(els.reward.value).toFixed(2),
    confirmationsNeeded: Number(els.confirmations.value),
    evidenceRequired: ["photo", "location", "timestamp", "typed_value"],
    verificationRules: [
      "OCR must match reported value",
      "Submission must be inside city geofence",
      "Evidence hash must be unique",
      "At least 2 accepted submissions before index update",
    ],
  };

  els.agentPayload.textContent = JSON.stringify(payload, null, 2);
}

function renderIndex() {
  els.indexRows.innerHTML = state.index
    .map(
      (row) => `
        <tr>
          <td><strong>${row.city}</strong></td>
          <td>${row.signal}</td>
          <td>${row.value}</td>
          <td>${row.confidence}%</td>
          <td><span class="status-pill status-${row.status}">${row.status}</span></td>
        </tr>
      `,
    )
    .join("");

  const feeRows = state.index.filter(
    (row) =>
      row.value.includes("%") &&
      (row.signal.toLowerCase().includes("fee") || row.signal.toLowerCase().includes("spread")),
  );
  const feeAverage =
    feeRows.reduce((sum, row) => sum + Number.parseFloat(row.value), 0) / feeRows.length;
  const confidenceAverage =
    state.index.reduce((sum, row) => sum + row.confidence, 0) / state.index.length;
  const payoutTotal = state.records.reduce(
    (sum, row) => sum + Number.parseFloat(row.payout),
    0,
  );

  els.avgFee.textContent = `${feeAverage.toFixed(1)}%`;
  els.avgConfidence.textContent = `${Math.round(confidenceAverage)}%`;
  els.totalPayouts.textContent = `${payoutTotal.toFixed(2)} cUSD`;
}

function renderTrendChart() {
  const width = 760;
  const height = 220;
  const pad = { top: 22, right: 34, bottom: 34, left: 42 };
  const series = [
    { key: "lagos", label: "Lagos", color: "#ffc400" },
    { key: "accra", label: "Accra", color: "#9cff4a" },
    { key: "nairobi", label: "Nairobi", color: "#87b7ff" },
  ];
  const values = state.trend.flatMap((row) => series.map((item) => row[item.key]));
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const x = (index) =>
    pad.left + (index / (state.trend.length - 1)) * (width - pad.left - pad.right);
  const y = (value) =>
    height - pad.bottom - ((value - min) / (max - min)) * (height - pad.top - pad.bottom);
  const pathFor = (key) =>
    state.trend
      .map(
        (row, index) =>
          `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(row[key]).toFixed(2)}`,
      )
      .join(" ");

  const grid = [2, 2.5, 3, 3.5, 4]
    .map(
      (tick) => `
        <g>
          <line x1="${pad.left}" y1="${y(tick)}" x2="${width - pad.right}" y2="${y(tick)}" class="chart-grid-line" />
          <text x="${pad.left - 12}" y="${y(tick) + 4}" class="chart-axis" text-anchor="end">${tick.toFixed(1)}%</text>
        </g>
      `,
    )
    .join("");

  const lines = series
    .map(
      (item) => `
        <path d="${pathFor(item.key)}" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        ${state.trend
          .map(
            (row, index) => `
              <circle cx="${x(index)}" cy="${y(row[item.key])}" r="4" fill="${item.color}" />
            `,
          )
          .join("")}
      `,
    )
    .join("");

  const labels = state.trend
    .map(
      (row, index) => `
        <text x="${x(index)}" y="${height - 9}" class="chart-axis" text-anchor="middle">${row.day}</text>
      `,
    )
    .join("");

  const legend = series
    .map(
      (item, index) => `
        <g transform="translate(${width - pad.right - 216 + index * 78}, 18)">
          <rect width="10" height="10" fill="${item.color}" rx="2"></rect>
          <text x="16" y="10" class="chart-legend">${item.label}</text>
        </g>
      `,
    )
    .join("");

  els.realityChart.innerHTML = `
    <defs>
      <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#ffc400" stop-opacity="0.18"></stop>
        <stop offset="100%" stop-color="#ffc400" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${pathFor("lagos")} L ${x(state.trend.length - 1)} ${height - pad.bottom} L ${pad.left} ${height - pad.bottom} Z" fill="url(#chartFill)"></path>
    ${lines}
    ${labels}
    ${legend}
  `;
}

function renderTasks() {
  els.taskFeed.innerHTML = state.requests
    .map(
      (request) => `
        <article class="task-card">
          <h4>${typeLabels[request.type]}</h4>
          <p>${request.question}</p>
          <dl>
            <div>
              <dt>Reward</dt>
              <dd>${request.reward.toFixed(2)} cUSD</dd>
            </div>
            <div>
              <dt>City</dt>
              <dd>${request.city}</dd>
            </div>
            <div>
              <dt>Needed</dt>
              <dd>${request.confirmations} proofs</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>${request.status}</dd>
            </div>
          </dl>
        </article>
      `,
    )
    .join("");

  els.submissionRequest.innerHTML = state.requests
    .map((request) => `<option value="${request.id}">${request.city} - ${typeLabels[request.type]}</option>`)
    .join("");
}

function renderRecords() {
  els.proofRecords.innerHTML = state.records
    .map(
      (record) => `
        <article class="proof-record">
          <div>
            <h4>${record.title}</h4>
            <span class="tx-hash">${record.id}</span>
          </div>
          <span class="status-pill status-verified">${record.confidence}% confidence</span>
          <p>${record.result}. Payout released: <strong>${record.payout}</strong>.</p>
          <span class="tx-hash">${record.tx}</span>
        </article>
      `,
    )
    .join("");
}

function setPanel(view) {
  if (view === "overview") {
    document.querySelector("#overview").scrollIntoView({ block: "start" });
  } else {
    document.querySelector(`[data-panel="${view}"]`).scrollIntoView({ block: "start" });
  }

  els.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  });

  els.panels.forEach((panel) => {
    panel.classList.toggle("is-visible", panel.dataset.panel === view);
  });
}

async function createRequest(event) {
  event.preventDefault();
  const reward = Number(els.reward.value);
  const confirmations = Number(els.confirmations.value);
  const payload = {
    question: els.agentQuestion.value.trim(),
    proofType: els.proofType.value,
    city: els.city.value,
    reward,
    confirmations,
  };

  try {
    const result = await apiRequest<CreateRequestResponse>("/api/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state = result.state;
  } catch (error) {
    const request = {
      id: `fp-req-${Math.floor(2000 + Math.random() * 8000)}`,
      question: payload.question,
      type: payload.proofType,
      city: payload.city,
      reward,
      confirmations,
      funded: reward * confirmations,
      status: "collecting",
      created: "now",
      chain: "celo" as const,
      asset: "cUSD",
    };
    state.requests.unshift(request);
    console.warn("Created proof request locally because API is unavailable.", error);
  }

  renderTasks();
  setPanel("contributor");
}

async function submitEvidence(event) {
  event.preventDefault();
  const request = state.requests.find((item) => item.id === els.submissionRequest.value);
  const reportedValue = mustQuery<HTMLInputElement>("#reportedValue").value.trim();
  const note = mustQuery<HTMLTextAreaElement>("#localNote").value.trim();
  const evidenceType = mustQuery<HTMLSelectElement>("#evidenceType").value;
  let confidence;
  let accepted;
  let checks;

  try {
    const result = await apiRequest<SubmissionResponse>("/api/submissions", {
      method: "POST",
      body: JSON.stringify({
        requestId: request.id,
        reportedValue,
        evidenceType,
        localNote: note,
      }),
    });
    state = result.state;
    confidence = result.submission.verification.confidence;
    accepted = result.submission.verification.accepted;
    checks = result.submission.verification.checks.map((check) => [check.label, check.detail]);
  } catch (error) {
    confidence = Math.min(
      96,
      82 + Math.round(Math.random() * 8) + (reportedValue.includes("%") ? 4 : 0),
    );
    accepted = confidence >= 86;
    checks = [
      ["Evidence relevance", "Receipt/photo matches request type"],
      ["Location window", `${request.city} geofence accepted`],
      ["Duplicate check", "Evidence hash is unique"],
      ["Value extraction", reportedValue],
      ["Verifier note", note],
    ];
    console.warn("Verified proof locally because API is unavailable.", error);
  }

  els.verifierTitle.textContent = accepted ? "Proof accepted" : "Manual review needed";
  els.scoreRing.textContent = `${confidence}%`;
  els.scoreRing.style.background = `
    radial-gradient(circle at center, #111411 58%, transparent 60%),
    conic-gradient(${accepted ? "var(--green)" : "var(--gold)"} ${confidence * 3.6}deg, #2a302b 0deg)
  `;
  els.verifierChecks.innerHTML = checks
    .map(([label, value]) => `<li><strong>${label}:</strong> ${value}</li>`)
    .join("");

  if (accepted && !state.records.some((record) => record.result.includes(reportedValue))) {
    const proofRecord = {
      id: `proof-${Math.random().toString(16).slice(2, 7)}`,
      title: `${request.city} ${typeLabels[request.type]} verified`,
      result: `${reportedValue}, accepted by AI verifier`,
      confidence,
      payout: `${request.reward.toFixed(2)} cUSD`,
      tx: `0x${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "").slice(0, 32)}`,
    };
    state.records.unshift(proofRecord);

    const existing = state.index.find((row) => row.city === request.city && row.signal === typeLabels[request.type]);
    if (existing) {
      existing.value = reportedValue;
      existing.confidence = confidence;
      existing.status = "verified";
    } else {
      state.index.unshift({
        city: request.city,
        signal: typeLabels[request.type],
        value: reportedValue,
        confidence,
        status: "verified",
      });
    }
    renderIndex();
    renderRecords();
  }

  renderIndex();
  renderTasks();
  renderRecords();
}

function updateCityDetail(city) {
  const data = citySignals[city];
  els.cityDetail.innerHTML = `
    <p class="eyebrow">Selected city</p>
    <h3>${city}</h3>
    <dl>
      <div>
        <dt>Cash-out fee</dt>
        <dd>${data.fee}</dd>
      </div>
      <div>
        <dt>Merchant acceptance</dt>
        <dd>${data.acceptance}</dd>
      </div>
      <div>
        <dt>Latest proof</dt>
        <dd>${data.latest}</dd>
      </div>
    </dl>
  `;
}

els.tabs.forEach((tab) => tab.addEventListener("click", () => setPanel(tab.dataset.view)));
document
  .querySelectorAll<HTMLButtonElement>("[data-jump]")
  .forEach((button) => button.addEventListener("click", () => setPanel(button.dataset.jump)));
document
  .querySelectorAll<HTMLButtonElement>("[data-city]")
  .forEach((button) => button.addEventListener("click", () => updateCityDetail(button.dataset.city)));

["input", "change"].forEach((eventName) => {
  [els.agentQuestion, els.proofType, els.city, els.reward, els.confirmations].forEach((input) => {
    input.addEventListener(eventName, formatPayload);
  });
});

els.requestForm.addEventListener("submit", createRequest);
els.submissionForm.addEventListener("submit", submitEvidence);

async function boot() {
  await Promise.all([loadRemoteState(), loadCeloConfig()]);
  await initMiniPayWallet();
  formatPayload();
  renderCeloContracts();
  renderIndex();
  renderTrendChart();
  renderTasks();
  renderRecords();
}

boot();
