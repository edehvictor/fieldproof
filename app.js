const state = {
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

const typeLabels = {
  cashout_fee: "Cash-out fee",
  merchant_acceptance: "Merchant acceptance",
  fx_spread: "Stablecoin-to-cash spread",
  local_price: "Local price benchmark",
};

const citySignals = {
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
  tabs: [...document.querySelectorAll(".nav-tab")],
  panels: [...document.querySelectorAll(".view-section")],
  requestForm: document.querySelector("#requestForm"),
  agentPayload: document.querySelector("#agentPayload"),
  agentQuestion: document.querySelector("#agentQuestion"),
  proofType: document.querySelector("#proofType"),
  city: document.querySelector("#city"),
  reward: document.querySelector("#reward"),
  confirmations: document.querySelector("#confirmations"),
  indexRows: document.querySelector("#indexRows"),
  taskFeed: document.querySelector("#taskFeed"),
  submissionRequest: document.querySelector("#submissionRequest"),
  submissionForm: document.querySelector("#submissionForm"),
  verifierTitle: document.querySelector("#verifierTitle"),
  verifierChecks: document.querySelector("#verifierChecks"),
  scoreRing: document.querySelector("#scoreRing"),
  proofRecords: document.querySelector("#proofRecords"),
  avgFee: document.querySelector("#avgFee"),
  avgConfidence: document.querySelector("#avgConfidence"),
  totalPayouts: document.querySelector("#totalPayouts"),
  cityDetail: document.querySelector("#cityDetail"),
  realityChart: document.querySelector("#realityChart"),
};

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

function createRequest(event) {
  event.preventDefault();
  const reward = Number(els.reward.value);
  const confirmations = Number(els.confirmations.value);
  const request = {
    id: `fp-req-${Math.floor(2000 + Math.random() * 8000)}`,
    question: els.agentQuestion.value.trim(),
    type: els.proofType.value,
    city: els.city.value,
    reward,
    confirmations,
    funded: reward * confirmations,
    status: "collecting",
    created: "now",
  };

  state.requests.unshift(request);
  renderTasks();
  setPanel("contributor");
}

function submitEvidence(event) {
  event.preventDefault();
  const request = state.requests.find((item) => item.id === els.submissionRequest.value);
  const reportedValue = document.querySelector("#reportedValue").value.trim();
  const note = document.querySelector("#localNote").value.trim();
  const confidence = Math.min(
    96,
    82 + Math.round(Math.random() * 8) + (reportedValue.includes("%") ? 4 : 0),
  );
  const accepted = confidence >= 86;

  els.verifierTitle.textContent = accepted ? "Proof accepted" : "Manual review needed";
  els.scoreRing.textContent = `${confidence}%`;
  els.scoreRing.style.background = `
    radial-gradient(circle at center, #111411 58%, transparent 60%),
    conic-gradient(${accepted ? "var(--green)" : "var(--gold)"} ${confidence * 3.6}deg, #2a302b 0deg)
  `;
  els.verifierChecks.innerHTML = [
    ["Evidence relevance", "Receipt/photo matches request type"],
    ["Location window", `${request.city} geofence accepted`],
    ["Duplicate check", "Evidence hash is unique"],
    ["Value extraction", reportedValue],
    ["Verifier note", note],
  ]
    .map(([label, value]) => `<li><strong>${label}:</strong> ${value}</li>`)
    .join("");

  if (accepted) {
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
  .querySelectorAll("[data-jump]")
  .forEach((button) => button.addEventListener("click", () => setPanel(button.dataset.jump)));
document
  .querySelectorAll("[data-city]")
  .forEach((button) => button.addEventListener("click", () => updateCityDetail(button.dataset.city)));

["input", "change"].forEach((eventName) => {
  [els.agentQuestion, els.proofType, els.city, els.reward, els.confirmations].forEach((input) => {
    input.addEventListener(eventName, formatPayload);
  });
});

els.requestForm.addEventListener("submit", createRequest);
els.submissionForm.addEventListener("submit", submitEvidence);

formatPayload();
renderIndex();
renderTrendChart();
renderTasks();
renderRecords();
