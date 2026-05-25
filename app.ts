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
  requester?: string | null;
  contractRequestId?: string | null;
  metadataHash?: string | null;
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
  contractRequestId?: string | null;
  contractSubmissionId?: string | null;
}

interface Submission {
  id: string;
  requestId: string;
  contributor?: string;
  contractSubmissionId?: string | null;
  evidenceHash?: string;
  submissionTx?: string | null;
  status?: "accepted" | "review" | "rejected";
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
  stableTokenDecimals: number;
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
  isMiniPay?: boolean;
  isMetaMask?: boolean;
  on?: (event: "accountsChanged" | "chainChanged", handler: (payload: unknown) => void) => void;
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
      question: "What spread is offered for USDm to local cash in Nairobi?",
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
      signal: "USDm cash-out fee",
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
      payout: "2.40 USDm",
      tx: "0x9b21b337c0e4a11df21e91c64f12d9a3fc220d1e4b6f177bc92e44b6f0a88219",
    },
    {
      id: "proof-77a03",
      title: "Accra MiniPay acceptance sample",
      result: "7 of 12 checked merchants accepted MiniPay",
      confidence: 87,
      payout: "2.40 USDm",
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
let walletEventsBound = false;

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
  requestChainStatus: mustQuery<HTMLElement>("#requestChainStatus"),
  submissionChainStatus: mustQuery<HTMLElement>("#submissionChainStatus"),
  contractNetwork: mustQuery<HTMLElement>("#contractNetwork"),
  escrowAddress: mustQuery<HTMLElement>("#escrowAddress"),
  registryAddress: mustQuery<HTMLElement>("#registryAddress"),
  stableTokenAddress: mustQuery<HTMLElement>("#stableTokenAddress"),
  escrowExplorer: mustQuery<HTMLAnchorElement>("#escrowExplorer"),
  registryExplorer: mustQuery<HTMLAnchorElement>("#registryExplorer"),
  avgFee: mustQuery<HTMLElement>("#avgFee"),
  avgConfidence: mustQuery<HTMLElement>("#avgConfidence"),
  totalPayouts: mustQuery<HTMLElement>("#totalPayouts"),
  cityDetail: mustQuery<HTMLElement>("#cityDetail"),
  walletStatus: mustQuery<HTMLButtonElement>("#walletStatus"),
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

const functionSelectors = {
  approve: "0x095ea7b3",
  allowance: "0xdd62ed3e",
  balanceOf: "0x70a08231",
  createRequest: "0x0b934572",
  submitProof: "0x2f19c56a",
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

function getWalletName(provider = window.ethereum) {
  if (provider?.isMiniPay) {
    return "MiniPay";
  }
  if (provider?.isMetaMask) {
    return "MetaMask";
  }
  return provider ? "Wallet" : "MiniPay/MetaMask";
}

function setWalletStatus(text: string, tone: "ready" | "connected" | "error" = "ready") {
  if (els.walletStatus) {
    els.walletStatus.textContent = text;
    els.walletStatus.classList.toggle("is-connected", tone === "connected");
    els.walletStatus.classList.toggle("is-error", tone === "error");
  }
}

function formatAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Pending";
}

function getRewardSymbol() {
  const network = celoRuntimeConfig?.activeNetwork || "sepolia";
  return celoRuntimeConfig?.[network]?.stableTokenSymbol || "USDm";
}

function renderCeloContracts() {
  const network = celoRuntimeConfig?.activeNetwork || "sepolia";
  const networkConfig = celoRuntimeConfig?.[network];
  const deployment = celoRuntimeConfig?.deployment;
  const explorer = deployment?.blockExplorer || networkConfig?.blockExplorer || "https://celo-sepolia.blockscout.com";
  const escrow = deployment?.contracts.FieldProofEscrow.address;
  const registry = deployment?.contracts.FieldProofRegistry.address;
  const stableToken = networkConfig?.stableToken;

  els.contractNetwork.textContent = networkConfig?.name || "Celo Sepolia";
  els.escrowAddress.textContent = formatAddress(escrow);
  els.registryAddress.textContent = formatAddress(registry);
  els.stableTokenAddress.textContent = formatAddress(stableToken);
  els.escrowAddress.title = escrow || "";
  els.registryAddress.title = registry || "";
  els.stableTokenAddress.title = stableToken || "";
  els.escrowExplorer.href = escrow ? `${explorer}/address/${escrow}` : explorer;
  els.registryExplorer.href = registry ? `${explorer}/address/${registry}` : explorer;
}

function setInlineStatus(element: HTMLElement, message: string, tone: "muted" | "success" | "error" = "muted") {
  element.textContent = message;
  element.classList.toggle("is-success", tone === "success");
  element.classList.toggle("is-error", tone === "error");
}

function strip0x(value: string) {
  return value.startsWith("0x") ? value.slice(2) : value;
}

function toQuantity(value: bigint) {
  return `0x${value.toString(16)}`;
}

function encodeAddress(value: string) {
  const address = strip0x(value);
  if (!/^[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid EVM address: ${value}`);
  }
  return address.toLowerCase().padStart(64, "0");
}

function encodeUint(value: bigint | number | string) {
  const bigintValue = BigInt(value);
  if (bigintValue < 0n) {
    throw new Error("Cannot ABI-encode a negative integer.");
  }
  return bigintValue.toString(16).padStart(64, "0");
}

function encodeBytes32(value: string) {
  const bytes = strip0x(value);
  if (!/^[0-9a-fA-F]{64}$/.test(bytes)) {
    throw new Error(`Expected bytes32 hex value: ${value}`);
  }
  return bytes.toLowerCase();
}

function encodeCall(selector: string, params: string[]) {
  return `0x${strip0x(selector)}${params.join("")}`;
}

function parseUnits(value: string | number, decimals: number) {
  const normalized = String(value).trim();
  const [wholePart, fractionPart = ""] = normalized.split(".");
  const whole = BigInt(wholePart || "0") * 10n ** BigInt(decimals);
  const fraction = BigInt((fractionPart + "0".repeat(decimals)).slice(0, decimals) || "0");
  return whole + fraction;
}

function formatUnits(value: bigint, decimals: number) {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return `0x${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function getOnchainContext() {
  const network = celoRuntimeConfig?.activeNetwork || "sepolia";
  const networkConfig = celoRuntimeConfig?.[network];
  const deployment = celoRuntimeConfig?.deployment;
  const escrow = deployment?.contracts.FieldProofEscrow.address;
  const registry = deployment?.contracts.FieldProofRegistry.address;
  const stableToken = networkConfig?.stableToken;

  if (!networkConfig || !deployment || !escrow || !registry || !stableToken) {
    throw new Error("Celo Sepolia contract or stable-token config is missing.");
  }

  return {
    network,
    networkConfig,
    deployment,
    escrow,
    registry,
    stableToken,
    decimals: networkConfig.stableTokenDecimals || 18,
    symbol: networkConfig.stableTokenSymbol || "USDm",
  };
}

async function ensureCeloWallet(requestAccounts = true) {
  const provider = window.ethereum;
  if (!provider) {
    setWalletStatus("Open MiniPay/MetaMask", "error");
    throw new Error("Open this app in MiniPay or MetaMask to sign Celo Sepolia transactions.");
  }

  bindWalletEvents(provider);
  const walletName = getWalletName(provider);
  const accounts = await provider.request<string[]>({
    method: requestAccounts ? "eth_requestAccounts" : "eth_accounts",
  });
  const account = accounts?.[0];

  if (requestAccounts && !account) {
    setWalletStatus(`Connect ${walletName}`, "error");
    throw new Error("Wallet connection was not completed.");
  }

  const chainId = await provider.request<string>({ method: "eth_chainId" });
  if ((requestAccounts || account) && chainId !== celoSepolia.chainId) {
    try {
      setWalletStatus("Switching to Celo", "ready");
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

  setWalletStatus(account ? `${walletName} ${formatAddress(account)}` : `Connect ${walletName}`, account ? "connected" : "ready");

  return { provider, account };
}

async function initMiniPayWallet() {
  const provider = window.ethereum;
  if (!provider) {
    setWalletStatus("Open MiniPay/MetaMask", "error");
    return;
  }

  try {
    bindWalletEvents(provider);
    const accounts = await provider.request<string[]>({ method: "eth_accounts" });
    const account = accounts?.[0];
    const walletName = getWalletName(provider);
    setWalletStatus(account ? `${walletName} ${formatAddress(account)}` : `Connect ${walletName}`, account ? "connected" : "ready");
  } catch (error) {
    setWalletStatus("Connect wallet", "error");
    console.warn("MiniPay/Celo wallet connection was not completed.", error);
  }
}

function bindWalletEvents(provider: EthereumProvider) {
  if (walletEventsBound || !provider.on) {
    return;
  }

  provider.on("accountsChanged", (payload) => {
    const accounts = Array.isArray(payload) ? payload : [];
    const account = typeof accounts[0] === "string" ? accounts[0] : undefined;
    const walletName = getWalletName(provider);
    setWalletStatus(account ? `${walletName} ${formatAddress(account)}` : `Connect ${walletName}`, account ? "connected" : "ready");
  });

  provider.on("chainChanged", (payload) => {
    if (payload === celoSepolia.chainId) {
      setWalletStatus(`Celo ${getWalletName(provider)}`, "connected");
    } else {
      setWalletStatus("Switch to Celo", "ready");
    }
  });

  walletEventsBound = true;
}

async function connectWallet() {
  try {
    setWalletStatus("Opening wallet", "ready");
    const { account } = await ensureCeloWallet(true);
    setWalletStatus(`${getWalletName()} ${formatAddress(account)}`, "connected");
    setInlineStatus(els.requestChainStatus, "Wallet connected. Ready to fund a request.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet connection failed.";
    setWalletStatus(window.ethereum ? "Connect wallet" : "Open MiniPay/MetaMask", "error");
    setInlineStatus(els.requestChainStatus, message, "error");
    console.warn("Wallet connection failed.", error);
  }
}

async function readUint(provider: EthereumProvider, to: string, data: string) {
  const result = await provider.request<string>({
    method: "eth_call",
    params: [{ to, data }, "latest"],
  });
  return result && result !== "0x" ? BigInt(result) : 0n;
}

async function waitForWalletReceipt(provider: EthereumProvider, txHash: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });
    if (receipt) {
      return receipt;
    }
    await sleep(2000);
  }
  throw new Error(`Timed out waiting for transaction ${txHash}`);
}

async function sendWalletTransaction(provider: EthereumProvider, from: string, to: string, data: string) {
  const hash = await provider.request<string>({
    method: "eth_sendTransaction",
    params: [{ from, to, data, value: "0x0" }],
  });
  await waitForWalletReceipt(provider, hash);
  return hash;
}

function formatPayload() {
  const payload = {
    agent: "fieldproof-verifier.celo",
    question: els.agentQuestion.value.trim(),
    proofType: els.proofType.value,
    city: els.city.value,
    asset: getRewardSymbol(),
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
  els.totalPayouts.textContent = `${payoutTotal.toFixed(2)} ${getRewardSymbol()}`;
  publishChartState();
}

function publishChartState() {
  window.dispatchEvent(
    new CustomEvent("fieldproof:state", {
      detail: state,
    }),
  );
}

function getVisibleRequests() {
  const symbol = getRewardSymbol();
  return state.requests.filter((request) => request.contractRequestId || !request.asset || request.asset === symbol);
}

function getAcceptedSubmissionCount(requestId: string) {
  return (
    state.submissions?.filter(
      (submission) => submission.requestId === requestId && submission.status === "accepted",
    ).length || 0
  );
}

function getDisplayRequestStatus(request: ProofRequest) {
  const acceptedCount = getAcceptedSubmissionCount(request.id);
  return acceptedCount >= Number(request.confirmations || 1) ? "verified" : request.status;
}

function getExplorerBase() {
  const network = celoRuntimeConfig?.activeNetwork || "sepolia";
  return (
    celoRuntimeConfig?.deployment?.blockExplorer ||
    celoRuntimeConfig?.[network]?.blockExplorer ||
    "https://celo-sepolia.blockscout.com"
  );
}

function transactionUrl(tx?: string) {
  return tx?.startsWith("0x") ? `${getExplorerBase()}/tx/${tx}` : null;
}

function getVisibleRecords() {
  const symbol = getRewardSymbol();
  return state.records.filter((record) => record.contractRequestId || record.payout.includes(symbol));
}

function renderTasks() {
  const requests = getVisibleRequests();

  els.taskFeed.innerHTML = requests
    .map(
      (request) => `
        <article class="task-card">
          <h4>${typeLabels[request.type]}</h4>
          <p>${request.question}</p>
          <dl>
            <div>
              <dt>Reward</dt>
              <dd>${request.reward.toFixed(2)} ${request.asset || getRewardSymbol()}</dd>
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
              <dd>${getDisplayRequestStatus(request)}</dd>
            </div>
            <div>
              <dt>Chain</dt>
              <dd>${request.contractRequestId ? `#${request.contractRequestId}` : "demo"}</dd>
            </div>
          </dl>
        </article>
      `,
    )
    .join("");

  els.submissionRequest.innerHTML = requests
    .map(
      (request) =>
        `<option value="${request.id}">${request.city} - ${typeLabels[request.type]} ${request.contractRequestId ? `#${request.contractRequestId}` : ""}</option>`,
    )
    .join("");
}

function renderRecords() {
  const records = getVisibleRecords();

  if (!records.length) {
    els.proofRecords.innerHTML = `
      <article class="proof-record">
        <div>
          <h4>No verified onchain records yet</h4>
          <span class="tx-hash">Create a request and submit proof to publish the first record.</span>
        </div>
      </article>
    `;
    return;
  }

  els.proofRecords.innerHTML = records
    .map(
      (record) => {
        const payoutUrl = transactionUrl(record.tx);
        const registryUrl = transactionUrl(record.recordTx);

        return `
        <article class="proof-record">
          <div>
            <h4>${record.title}</h4>
            <span class="tx-hash">${record.contractRequestId ? `request #${record.contractRequestId}` : record.id}</span>
          </div>
          <span class="status-pill status-verified">${record.confidence}% confidence</span>
          <p>${record.result}. Payout released: <strong>${record.payout}</strong>.</p>
          <div class="record-meta">
            ${
              payoutUrl
                ? `<a class="tx-link" href="${payoutUrl}" target="_blank" rel="noreferrer">Payout tx ${formatAddress(record.tx)}</a>`
                : `<span class="tx-hash">${record.tx}</span>`
            }
            ${
              registryUrl
                ? `<a class="tx-link" href="${registryUrl}" target="_blank" rel="noreferrer">Registry tx ${formatAddress(record.recordTx)}</a>`
                : ""
            }
            ${record.evidenceHash ? `<span class="tx-hash">Evidence ${formatAddress(record.evidenceHash)}</span>` : ""}
          </div>
        </article>
      `;
      },
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
  const submitButton = els.requestForm.querySelector<HTMLButtonElement>("button[type='submit']");
  const payload = {
    question: els.agentQuestion.value.trim(),
    proofType: els.proofType.value,
    city: els.city.value,
    reward,
    confirmations,
  };

  try {
    if (submitButton) {
      submitButton.disabled = true;
    }
    setInlineStatus(els.requestChainStatus, "Connecting Celo Sepolia wallet...", "muted");
    const { provider, account } = await ensureCeloWallet(true);
    const ctx = getOnchainContext();
    const rewardUnits = parseUnits(reward.toFixed(6), ctx.decimals);
    const totalFunding = rewardUnits * BigInt(confirmations);
    const balanceData = encodeCall(functionSelectors.balanceOf, [encodeAddress(account)]);
    const balance = await readUint(provider, ctx.stableToken, balanceData);

    if (balance < totalFunding) {
      throw new Error(
        `Need ${formatUnits(totalFunding, ctx.decimals)} ${ctx.symbol} to fund this request. Current balance: ${formatUnits(balance, ctx.decimals)} ${ctx.symbol}. Swap test CELO to ${ctx.symbol} in Mento, then retry.`,
      );
    }

    const allowanceData = encodeCall(functionSelectors.allowance, [
      encodeAddress(account),
      encodeAddress(ctx.escrow),
    ]);
    const allowance = await readUint(provider, ctx.stableToken, allowanceData);
    if (allowance < totalFunding) {
      setInlineStatus(els.requestChainStatus, `Approving ${ctx.symbol} escrow...`, "muted");
      const approveData = encodeCall(functionSelectors.approve, [
        encodeAddress(ctx.escrow),
        encodeUint(totalFunding),
      ]);
      await sendWalletTransaction(provider, account, ctx.stableToken, approveData);
    }

    setInlineStatus(els.requestChainStatus, "Funding FieldProofEscrow on Celo Sepolia...", "muted");
    const metadataHash = await sha256Hex(
      JSON.stringify({
        ...payload,
        asset: ctx.symbol,
        stableToken: ctx.stableToken,
        requester: account,
        createdAt: new Date().toISOString(),
      }),
    );
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 48);
    const createRequestData = encodeCall(functionSelectors.createRequest, [
      encodeAddress(ctx.stableToken),
      encodeUint(rewardUnits),
      encodeUint(confirmations),
      encodeUint(deadline),
      encodeBytes32(metadataHash),
    ]);
    const escrowTx = await sendWalletTransaction(provider, account, ctx.escrow, createRequestData);

    setInlineStatus(els.requestChainStatus, "Indexing request transaction...", "muted");
    const result = await apiRequest<CreateRequestResponse>("/api/requests", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        mode: "onchain",
        asset: ctx.symbol,
        requester: account,
        metadataHash,
        escrowTx,
      }),
    });
    state = result.state;
    setInlineStatus(
      els.requestChainStatus,
      `Funded on Celo Sepolia: request #${result.request.contractRequestId}`,
      "success",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fund request on Celo Sepolia.";
    setInlineStatus(els.requestChainStatus, message, "error");
    console.warn("Onchain proof request was not completed.", error);
    return;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }

  renderTasks();
  setPanel("contributor");
}

async function submitEvidence(event) {
  event.preventDefault();
  const request = state.requests.find((item) => item.id === els.submissionRequest.value);
  if (!request) {
    setInlineStatus(els.submissionChainStatus, "Select a proof request before submitting evidence.", "error");
    return;
  }
  const reportedValue = mustQuery<HTMLInputElement>("#reportedValue").value.trim();
  const note = mustQuery<HTMLTextAreaElement>("#localNote").value.trim();
  const evidenceType = mustQuery<HTMLSelectElement>("#evidenceType").value;
  const submitButton = els.submissionForm.querySelector<HTMLButtonElement>("button[type='submit']");
  let confidence;
  let accepted;
  let checks;

  try {
    if (submitButton) {
      submitButton.disabled = true;
    }
    let contributor = "minipay-demo-user";
    let evidenceHash = await sha256Hex(
      JSON.stringify({
        requestId: request.id,
        contractRequestId: request.contractRequestId,
        reportedValue,
        evidenceType,
        note,
        createdAt: new Date().toISOString(),
      }),
    );
    let submissionTx = null;

    if (request.contractRequestId) {
      setInlineStatus(els.submissionChainStatus, "Submitting evidence hash to FieldProofEscrow...", "muted");
      const { provider, account } = await ensureCeloWallet(true);
      const ctx = getOnchainContext();
      contributor = account;
      const submitProofData = encodeCall(functionSelectors.submitProof, [
        encodeUint(request.contractRequestId),
        encodeBytes32(evidenceHash),
      ]);
      submissionTx = await sendWalletTransaction(provider, account, ctx.escrow, submitProofData);
      setInlineStatus(els.submissionChainStatus, "Verifier signing payout and registry record...", "muted");
    } else {
      setInlineStatus(els.submissionChainStatus, "Demo request selected. Create an onchain request for real payout.", "muted");
    }

    const result = await apiRequest<SubmissionResponse>("/api/submissions", {
      method: "POST",
      body: JSON.stringify({
        requestId: request.id,
        reportedValue,
        evidenceType,
        localNote: note,
        contributor,
        evidenceHash,
        submissionTx,
      }),
    });
    state = result.state;
    confidence = result.submission.verification.confidence;
    accepted = result.submission.verification.accepted;
    checks = result.submission.verification.checks.map((check) => [check.label, check.detail]);
    setInlineStatus(
      els.submissionChainStatus,
      request.contractRequestId && result.record?.tx
        ? `Proof accepted. Payout tx: ${formatAddress(result.record.tx)}`
        : "Evidence checked by local verifier.",
      accepted ? "success" : "muted",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit proof on Celo Sepolia.";
    setInlineStatus(els.submissionChainStatus, message, "error");
    console.warn("Proof submission was not completed.", error);
    return;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
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
      payout: `${request.reward.toFixed(2)} ${request.asset || getRewardSymbol()}`,
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
els.walletStatus.addEventListener("click", connectWallet);
window.addEventListener("fieldproof:city", (event) => {
  const city = (event as CustomEvent<string>).detail;
  if (city) {
    updateCityDetail(city);
  }
});

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
  renderTasks();
  renderRecords();
}

boot();
