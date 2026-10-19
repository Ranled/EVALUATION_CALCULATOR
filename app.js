// =========================================================================
// CHARRMPASS — Automated System Evaluation & Survey Calculator Logic
// =========================================================================

const STORAGE_KEY = "CHARRMPASS_EVAL_STATE_V1";

// Application State
let appState = {
  targetN: 50,
  activeIsoFilter: "ALL",
  isoTallies: {},      // { "1": { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, ... "65": ... }
  susTallies: {},      // { "1": { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, ... "10": ... }
  demographics: {
    age: {},
    sex: {},
    role: {}
  },
  encodedRespondents: []
};

// =========================================================================
// INITIALIZATION & STATE MANAGEMENT
// =========================================================================
function createEmptyState() {
  const isoTallies = {};
  ISO_CRITERIA.forEach(crit => {
    crit.subcriteria.forEach(sub => {
      sub.questions.forEach(q => {
        isoTallies[q.num] = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      });
    });
  });

  const susTallies = {};
  SUS_QUESTIONS.forEach(q => {
    susTallies[q.num] = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  });

  const demographics = { age: {}, sex: {}, role: {} };
  DEMOGRAPHIC_CONFIG.age.forEach(item => demographics.age[item.id] = 0);
  DEMOGRAPHIC_CONFIG.sex.forEach(item => demographics.sex[item.id] = 0);
  DEMOGRAPHIC_CONFIG.role.forEach(item => demographics.role[item.id] = 0);

  return {
    targetN: 50,
    activeIsoFilter: "ALL",
    isoTallies,
    susTallies,
    demographics,
    encodedRespondents: []
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const fresh = createEmptyState();
  if (!raw) {
    appState = fresh;
    loadRealisticSampleData(false); // Preload N=50 sample data on very first launch so user sees live calculations immediately
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    appState = {
      ...fresh,
      ...parsed,
      isoTallies: { ...fresh.isoTallies, ...(parsed.isoTallies || {}) },
      susTallies: { ...fresh.susTallies, ...(parsed.susTallies || {}) },
      demographics: {
        age: { ...fresh.demographics.age, ...(parsed.demographics?.age || {}) },
        sex: { ...fresh.demographics.sex, ...(parsed.demographics?.sex || {}) },
        role: { ...fresh.demographics.role, ...(parsed.demographics?.role || {}) }
      },
      encodedRespondents: parsed.encodedRespondents || []
    };
  } catch (err) {
    console.error("Failed to parse saved state, resetting:", err);
    appState = fresh;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// =========================================================================
// MATHEMATICAL & INTERPRETATION HELPERS
// =========================================================================
function computeItemStats(tallyObj) {
  const f5 = Number(tallyObj[5] || 0);
  const f4 = Number(tallyObj[4] || 0);
  const f3 = Number(tallyObj[3] || 0);
  const f2 = Number(tallyObj[2] || 0);
  const f1 = Number(tallyObj[1] || 0);

  const totalN = f5 + f4 + f3 + f2 + f1;
  const weightedScore = (f5 * 5) + (f4 * 4) + (f3 * 3) + (f2 * 2) + (f1 * 1);
  const weightedMean = totalN > 0 ? weightedScore / totalN : 0;

  return { f5, f4, f3, f2, f1, totalN, weightedScore, weightedMean };
}

function getVerbalInterpretation(wm, hasData = true) {
  if (!hasData || wm <= 0) {
    return { label: "No Data", badgeClass: "badge-empty" };
  }
  if (wm >= 4.21) return { label: "Very Satisfied", badgeClass: "badge-vs" };
  if (wm >= 3.41) return { label: "Satisfied", badgeClass: "badge-s" };
  if (wm >= 2.61) return { label: "Neutral", badgeClass: "badge-n" };
  if (wm >= 1.81) return { label: "Unsatisfied", badgeClass: "badge-u" };
  return { label: "Very Unsatisfied", badgeClass: "badge-vu" };
}

function getSusGradeInterpretation(susScore, hasData = true) {
  if (!hasData) {
    return { label: "No Data", shortLabel: "No Data", badgeClass: "badge-empty", grade: "—", percentile: "—", rank: "—" };
  }
  for (const g of SUS_GRADE_SCALE) {
    if (susScore >= g.min) {
      return {
        label: `Grade ${g.grade} • ${g.rank} (${g.percentile} %ile)`,
        shortLabel: `Grade ${g.grade} (${g.rank})`,
        grade: g.grade,
        percentile: g.percentile,
        rank: g.rank,
        rangeLabel: g.rangeLabel,
        badgeClass: g.badgeClass
      };
    }
  }
  return { label: "Grade F • Poor (0–14% %ile)", shortLabel: "Grade F (Poor)", grade: "F", percentile: "0–14%", rank: "Poor", badgeClass: "badge-vu" };
}

// =========================================================================
// SAMPLE DATA GENERATOR (MATCHES USER'S SCREENSHOT FOR N=50)
// =========================================================================
function loadRealisticSampleData(showAlert = true) {
  const fresh = createEmptyState();
  fresh.targetN = 50;

  // Functional Completeness (Q1 - Q8): Average frequencies 10 at 5, 33 at 4, 7 at 3 => WM = 4.06 (Weighted Score = 203/item)
  for (let q = 1; q <= 8; q++) {
    fresh.isoTallies[q] = { 5: 10, 4: 33, 3: 7, 2: 0, 1: 0 };
  }

  // Functional Correctness (Q9 - Q16): Average frequencies 9 at 5, 31 at 4, 10 at 3 => WM = 3.98 (Weighted Score = 199/item)
  for (let q = 9; q <= 16; q++) {
    fresh.isoTallies[q] = { 5: 9, 4: 31, 3: 10, 2: 0, 1: 0 };
  }

  // Functional Appropriateness (Q17 - Q23): Average frequencies 5 at 5, 22 at 4, 23 at 3 => WM = 3.64 (Weighted Score = 182/item)
  for (let q = 17; q <= 23; q++) {
    fresh.isoTallies[q] = { 5: 5, 4: 22, 3: 23, 2: 0, 1: 0 };
  }

  // Other Criteria B through H (Realistic N=50 distributions)
  const sampleDistributions = [
    { 5: 18, 4: 26, 3: 6, 2: 0, 1: 0 }, // WM = 4.24 (Very Satisfied)
    { 5: 15, 4: 28, 3: 7, 2: 0, 1: 0 }, // WM = 4.16 (Satisfied)
    { 5: 20, 4: 24, 3: 6, 2: 0, 1: 0 }, // WM = 4.28 (Very Satisfied)
    { 5: 16, 4: 27, 3: 7, 2: 0, 1: 0 }, // WM = 4.18 (Satisfied)
    { 5: 22, 4: 23, 3: 5, 2: 0, 1: 0 }, // WM = 4.34 (Very Satisfied)
    { 5: 14, 4: 29, 3: 7, 2: 0, 1: 0 }, // WM = 4.14 (Satisfied)
    { 5: 19, 4: 25, 3: 6, 2: 0, 1: 0 }  // WM = 4.26 (Very Satisfied)
  ];

  for (let q = 24; q <= 65; q++) {
    const dist = sampleDistributions[q % sampleDistributions.length];
    fresh.isoTallies[q] = { ...dist };
  }

  // SUS Questions (1-10): Realistic positive & negative item responses for N=50
  SUS_QUESTIONS.forEach(sq => {
    if (sq.polarity === "positive") {
      fresh.susTallies[sq.num] = { 5: 18, 4: 25, 3: 7, 2: 0, 1: 0 };
    } else {
      // Negative items (lower score = better usability)
      fresh.susTallies[sq.num] = { 5: 0, 4: 2, 3: 8, 2: 26, 1: 14 };
    }
  });

  // Demographics for N=50
  fresh.demographics.age = {
    age_18_20: 14,
    age_21_25: 18,
    age_26_30: 8,
    age_31_40: 6,
    age_41_up: 4
  };
  fresh.demographics.sex = {
    sex_male: 27,
    sex_female: 21,
    sex_prefer_not: 2
  };
  fresh.demographics.role = {
    role_student: 25,
    role_faculty: 10,
    role_staff: 8,
    role_security: 5,
    role_other: 2
  };

  appState = fresh;
  saveState();
  renderAll();
  if (showAlert) {
    alert("Loaded N=50 Sample Evaluation Data!\n\nNotice how Criterion A (Functional Suitability) matches your formula screenshot:\n• Functional Completeness = 4.06\n• Functional Correctness = 3.98\n• Functional Appropriateness = 3.64\n• Total Weighted Score = 11.68\n• Total Weighted Mean = 3.89 (Satisfied)");
  }
}

// =========================================================================
// UI BUILDERS & RENDERING
// =========================================================================
function buildIsoFilterPills() {
  const container = document.getElementById("isoFilterPills");
  let html = `<button class="criterion-pill ${appState.activeIsoFilter === 'ALL' ? 'active' : ''}" data-crit="ALL">All Criteria (A–H)</button>`;
  ISO_CRITERIA.forEach(c => {
    const active = appState.activeIsoFilter === c.id ? "active" : "";
    html += `<button class="criterion-pill ${active}" data-crit="${c.id}">${c.code}. ${c.shortTitle}</button>`;
  });
  container.innerHTML = html;

  container.querySelectorAll(".criterion-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      appState.activeIsoFilter = btn.getAttribute("data-crit");
      saveState();
      buildIsoFilterPills();
      renderIsoTables();
    });
  });
}

function renderIsoTables() {
  const container = document.getElementById("isoCriteriaContainer");
  let html = "";

  ISO_CRITERIA.forEach(crit => {
    if (appState.activeIsoFilter !== "ALL" && appState.activeIsoFilter !== crit.id) {
      return;
    }

    html += `
      <div class="section-card" id="card-crit-${crit.id}">
        <div class="section-card-header">
          <h2>${crit.title}</h2>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span id="crit-header-mean-${crit.id}" class="brand-badge">WM: 0.00</span>
            <span id="crit-header-badge-${crit.id}" class="badge badge-empty">No Data</span>
          </div>
        </div>
        <div class="section-card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="eval-table">
              <thead>
                <tr>
                  <th class="q-num-cell">#</th>
                  <th class="q-text-cell">Evaluation Statement / Indicator</th>
                  <th class="score-col-header">5<br><small>(VS)</small></th>
                  <th class="score-col-header">4<br><small>(S)</small></th>
                  <th class="score-col-header">3<br><small>(N)</small></th>
                  <th class="score-col-header">2<br><small>(U)</small></th>
                  <th class="score-col-header">1<br><small>(VU)</small></th>
                  <th class="num-col">Total N</th>
                  <th class="num-col">Weighted Score<br><small>&Sigma;(f&times;x)</small></th>
                  <th class="num-col">Weighted Mean<br><small>&Sigma;(f&times;x)/N</small></th>
                  <th class="num-col">Verbal Interpretation</th>
                </tr>
              </thead>
              <tbody>
    `;

    crit.subcriteria.forEach(sub => {
      html += `
        <tr class="subcriterion-banner-row">
          <td colspan="11">&#9656; ${sub.title}</td>
        </tr>
      `;

      sub.questions.forEach(q => {
        const t = appState.isoTallies[q.num] || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        html += `
          <tr data-qnum="${q.num}">
            <td class="q-num-cell">${q.num}</td>
            <td class="q-text-cell">${q.text}</td>
            <td class="num-col"><input type="number" min="0" class="freq-input iso-freq-input" data-q="${q.num}" data-score="5" value="${t[5]}" /></td>
            <td class="num-col"><input type="number" min="0" class="freq-input iso-freq-input" data-q="${q.num}" data-score="4" value="${t[4]}" /></td>
            <td class="num-col"><input type="number" min="0" class="freq-input iso-freq-input" data-q="${q.num}" data-score="3" value="${t[3]}" /></td>
            <td class="num-col"><input type="number" min="0" class="freq-input iso-freq-input" data-q="${q.num}" data-score="2" value="${t[2]}" /></td>
            <td class="num-col"><input type="number" min="0" class="freq-input iso-freq-input" data-q="${q.num}" data-score="1" value="${t[1]}" /></td>
            <td class="num-col" id="iso-n-${q.num}">0</td>
            <td class="num-col" id="iso-ws-${q.num}">0</td>
            <td class="wm-cell" id="iso-wm-${q.num}">0.00</td>
            <td class="num-col" id="iso-vi-${q.num}"></td>
          </tr>
        `;
      });

      // Sub-criterion summary row
      html += `
        <tr class="subcriterion-summary-row" id="sub-row-${sub.id}">
          <td colspan="2" style="text-align:right; padding-right:1rem;">
            <strong>${sub.title} Sub-Criterion Summary:</strong>
          </td>
          <td class="num-col" id="sub-f5-${sub.id}">0</td>
          <td class="num-col" id="sub-f4-${sub.id}">0</td>
          <td class="num-col" id="sub-f3-${sub.id}">0</td>
          <td class="num-col" id="sub-f2-${sub.id}">0</td>
          <td class="num-col" id="sub-f1-${sub.id}">0</td>
          <td class="num-col" id="sub-n-${sub.id}">0</td>
          <td class="num-col" id="sub-ws-${sub.id}" title="Sum of Weighted Means / Avg Weighted Score">0.00</td>
          <td class="wm-cell" id="sub-wm-${sub.id}">0.00</td>
          <td class="num-col" id="sub-vi-${sub.id}"></td>
        </tr>
      `;
    });

    html += `
              </tbody>
              <tfoot>
                <tr class="criterion-total-footer">
                  <td colspan="7" style="text-align:right; padding-right:1rem;">
                    <strong>${crit.title} — TOTAL WEIGHTED SCORE (Sum of Item WMs) &amp; GENERAL AVERAGE:</strong>
                  </td>
                  <td class="num-col" id="crit-n-${crit.id}">—</td>
                  <td class="num-col" id="crit-tws-${crit.id}">0.00</td>
                  <td class="wm-cell" id="crit-wm-${crit.id}" style="font-size:1.05rem;">0.00</td>
                  <td class="num-col" id="crit-vi-${crit.id}"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind input events
  container.querySelectorAll(".iso-freq-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const qNum = e.target.getAttribute("data-q");
      const score = e.target.getAttribute("data-score");
      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
      appState.isoTallies[qNum][score] = val;
      saveState();
      recalculateAndUpdateUI();
    });
  });

  recalculateAndUpdateUI();
}

function renderSusTable() {
  const tbody = document.getElementById("tbodySus");
  let html = "";

  SUS_QUESTIONS.forEach(sq => {
    const t = appState.susTallies[sq.num] || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const polBadge = sq.polarity === "positive"
      ? `<span class="badge badge-s" title="Step 1 (Odd item): Adjusted Score = (Response - 1)">Odd (+): X &minus; 1</span>`
      : `<span class="badge badge-n" title="Step 2 (Even item): Adjusted Score = (5 - Response)">Even (&minus;): 5 &minus; X</span>`;

    html += `
      <tr>
        <td class="q-num-cell">${sq.num}</td>
        <td class="q-text-cell">${sq.text}</td>
        <td class="num-col">${polBadge}</td>
        <td class="num-col"><input type="number" min="0" class="freq-input sus-freq-input" data-sq="${sq.num}" data-score="5" value="${t[5]}" /></td>
        <td class="num-col"><input type="number" min="0" class="freq-input sus-freq-input" data-sq="${sq.num}" data-score="4" value="${t[4]}" /></td>
        <td class="num-col"><input type="number" min="0" class="freq-input sus-freq-input" data-sq="${sq.num}" data-score="3" value="${t[3]}" /></td>
        <td class="num-col"><input type="number" min="0" class="freq-input sus-freq-input" data-sq="${sq.num}" data-score="2" value="${t[2]}" /></td>
        <td class="num-col"><input type="number" min="0" class="freq-input sus-freq-input" data-sq="${sq.num}" data-score="1" value="${t[1]}" /></td>
        <td class="num-col" id="sus-n-${sq.num}">0</td>
        <td class="num-col" id="sus-ws-${sq.num}">0</td>
        <td class="wm-cell" id="sus-wm-${sq.num}">0.00</td>
        <td class="num-col" id="sus-contrib-${sq.num}" style="font-weight:700; color:var(--green-800);">0.00</td>
        <td class="num-col" id="sus-vi-${sq.num}"></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  tbody.querySelectorAll(".sus-freq-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const sqNum = e.target.getAttribute("data-sq");
      const score = e.target.getAttribute("data-score");
      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
      appState.susTallies[sqNum][score] = val;
      saveState();
      recalculateAndUpdateUI();
    });
  });

  initSingleParticipantSusSim();
}

function renderDemographicsTables() {
  const container = document.getElementById("demographicsContainer");
  const groups = [
    { key: "age", title: "2. Age Distribution", items: DEMOGRAPHIC_CONFIG.age },
    { key: "sex", title: "3. Sex Distribution", items: DEMOGRAPHIC_CONFIG.sex },
    { key: "role", title: "4. Role / Position", items: DEMOGRAPHIC_CONFIG.role }
  ];

  let html = "";
  groups.forEach(g => {
    html += `
      <div class="section-card">
        <div class="section-card-header">
          <h2>${g.title}</h2>
          <span class="brand-badge" id="demo-total-badge-${g.key}">Total: 0</span>
        </div>
        <div class="section-card-body" style="padding:0;">
          <table class="eval-table">
            <thead>
              <tr>
                <th>Category</th>
                <th class="num-col" style="width:90px;">Frequency (f)</th>
                <th class="num-col" style="width:95px;">Percentage</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
    `;

    g.items.forEach(item => {
      const val = appState.demographics[g.key][item.id] || 0;
      html += `
        <tr>
          <td><strong>${item.label}</strong></td>
          <td class="num-col">
            <input type="number" min="0" class="freq-input demo-freq-input" data-group="${g.key}" data-id="${item.id}" value="${val}" />
          </td>
          <td class="num-col" id="demo-pct-${item.id}" style="font-weight:700;">0.00%</td>
          <td>
            <div class="chart-bar-wrap">
              <div class="chart-bar-track">
                <div class="chart-bar-fill" id="demo-bar-${item.id}" style="width:0%;"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
            <tfoot>
              <tr class="criterion-total-footer">
                <td><strong>TOTAL</strong></td>
                <td class="num-col" id="demo-sum-${g.key}">0</td>
                <td class="num-col" id="demo-sumpct-${g.key}">100.0%</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll(".demo-freq-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const grp = e.target.getAttribute("data-group");
      const id = e.target.getAttribute("data-id");
      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
      appState.demographics[grp][id] = val;
      saveState();
      updateDemographicsCalculations();
    });
  });

  updateDemographicsCalculations();
}

function updateDemographicsCalculations() {
  ["age", "sex", "role"].forEach(grpKey => {
    const items = DEMOGRAPHIC_CONFIG[grpKey];
    let total = 0;
    items.forEach(item => {
      total += Number(appState.demographics[grpKey][item.id] || 0);
    });

    const badgeEl = document.getElementById(`demo-total-badge-${grpKey}`);
    const sumEl = document.getElementById(`demo-sum-${grpKey}`);
    const sumPctEl = document.getElementById(`demo-sumpct-${grpKey}`);
    if (badgeEl) badgeEl.textContent = `Total N = ${total}`;
    if (sumEl) sumEl.textContent = total;
    if (sumPctEl) sumPctEl.textContent = total > 0 ? "100.00%" : "0.00%";

    items.forEach(item => {
      const f = Number(appState.demographics[grpKey][item.id] || 0);
      const pct = total > 0 ? (f / total) * 100 : 0;
      const pctEl = document.getElementById(`demo-pct-${item.id}`);
      const barEl = document.getElementById(`demo-bar-${item.id}`);
      if (pctEl) pctEl.textContent = `${pct.toFixed(2)}%`;
      if (barEl) barEl.style.width = `${Math.min(100, pct)}%`;
    });
  });
}

// =========================================================================
// MASTER CALCULATION & LIVE UI UPDATER
// =========================================================================
function recalculateAndUpdateUI() {
  let grandSumCriterionMeans = 0;
  let validCriteriaCount = 0;
  let totalItemN = 0;
  let countedItems = 0;

  let bestCriterion = null;
  const criteriaSummaries = [];
  const allSubcriteriaSummaries = [];

  ISO_CRITERIA.forEach(crit => {
    let critSumItemWM = 0;
    let critValidItemCount = 0;
    let critTotalResponses = 0;

    const subSummaries = [];

    crit.subcriteria.forEach(sub => {
      let subF5 = 0, subF4 = 0, subF3 = 0, subF2 = 0, subF1 = 0;
      let subSumWM = 0;
      let subSumWS = 0;
      let subValidCount = 0;

      sub.questions.forEach(q => {
        const stats = computeItemStats(appState.isoTallies[q.num]);
        const vi = getVerbalInterpretation(stats.weightedMean, stats.totalN > 0);

        // Update item row if visible in DOM
        const elN = document.getElementById(`iso-n-${q.num}`);
        const elWS = document.getElementById(`iso-ws-${q.num}`);
        const elWM = document.getElementById(`iso-wm-${q.num}`);
        const elVI = document.getElementById(`iso-vi-${q.num}`);

        if (elN) elN.textContent = stats.totalN;
        if (elWS) elWS.textContent = stats.weightedScore;
        if (elWM) elWM.textContent = stats.totalN > 0 ? stats.weightedMean.toFixed(2) : "0.00";
        if (elVI) elVI.innerHTML = `<span class="badge ${vi.badgeClass}">${vi.label}</span>`;

        subF5 += stats.f5;
        subF4 += stats.f4;
        subF3 += stats.f3;
        subF2 += stats.f2;
        subF1 += stats.f1;
        subSumWS += stats.weightedScore;

        if (stats.totalN > 0) {
          subSumWM += stats.weightedMean;
          subValidCount++;
          critSumItemWM += stats.weightedMean;
          critValidItemCount++;
          critTotalResponses += stats.totalN;
          totalItemN += stats.totalN;
          countedItems++;
        }
      });

      const qCount = sub.questions.length;
      const avgF5 = subF5 / qCount;
      const avgF4 = subF4 / qCount;
      const avgF3 = subF3 / qCount;
      const avgF2 = subF2 / qCount;
      const avgF1 = subF1 / qCount;
      const avgN = (subF5 + subF4 + subF3 + subF2 + subF1) / qCount;
      const avgWS = subSumWS / qCount;
      const subWM = subValidCount > 0 ? subSumWM / subValidCount : 0;
      const subVI = getVerbalInterpretation(subWM, subValidCount > 0);

      // Update Sub-criterion footer in Tab 1
      const elSubF5 = document.getElementById(`sub-f5-${sub.id}`);
      const elSubF4 = document.getElementById(`sub-f4-${sub.id}`);
      const elSubF3 = document.getElementById(`sub-f3-${sub.id}`);
      const elSubF2 = document.getElementById(`sub-f2-${sub.id}`);
      const elSubF1 = document.getElementById(`sub-f1-${sub.id}`);
      const elSubN  = document.getElementById(`sub-n-${sub.id}`);
      const elSubWS = document.getElementById(`sub-ws-${sub.id}`);
      const elSubWM = document.getElementById(`sub-wm-${sub.id}`);
      const elSubVI = document.getElementById(`sub-vi-${sub.id}`);

      if (elSubF5) elSubF5.textContent = Number.isInteger(avgF5) ? avgF5 : avgF5.toFixed(1);
      if (elSubF4) elSubF4.textContent = Number.isInteger(avgF4) ? avgF4 : avgF4.toFixed(1);
      if (elSubF3) elSubF3.textContent = Number.isInteger(avgF3) ? avgF3 : avgF3.toFixed(1);
      if (elSubF2) elSubF2.textContent = Number.isInteger(avgF2) ? avgF2 : avgF2.toFixed(1);
      if (elSubF1) elSubF1.textContent = Number.isInteger(avgF1) ? avgF1 : avgF1.toFixed(1);
      if (elSubN)  elSubN.textContent  = Number.isInteger(avgN) ? avgN : avgN.toFixed(1);
      if (elSubWS) elSubWS.textContent = `${subSumWM.toFixed(2)} (Avg WS: ${avgWS.toFixed(1)})`;
      if (elSubWM) elSubWM.textContent = subValidCount > 0 ? subWM.toFixed(2) : "0.00";
      if (elSubVI) elSubVI.innerHTML   = `<span class="badge ${subVI.badgeClass}">${subVI.label}</span>`;

      const subSummaryObj = {
        critCode: crit.code,
        critTitle: crit.shortTitle,
        subId: sub.id,
        subTitle: sub.title,
        itemCount: qCount,
        avgF5, avgF4, avgF3, avgF2, avgF1, avgN, avgWS,
        sumItemWM: subSumWM,
        weightedMean: subWM,
        hasData: subValidCount > 0,
        vi: subVI
      };
      subSummaries.push(subSummaryObj);
      allSubcriteriaSummaries.push(subSummaryObj);
    });

    // Criterion Mean
    // Note: For Criterion A (Functional Suitability), the user's screenshot calculates:
    // Total Weighted Score = Sum of the 3 sub-criteria weighted means (4.06 + 3.98 + 3.64 = 11.68)
    // Total Weighted Mean = 11.68 / 3 = 3.89.
    // Let's compute both the mean of sub-criteria AND the mean of items so both are clearly shown!
    const validSubs = subSummaries.filter(s => s.hasData);
    const sumSubWMs = validSubs.reduce((acc, s) => acc + s.weightedMean, 0);
    const critMeanBySub = validSubs.length > 0 ? sumSubWMs / validSubs.length : 0;
    const critMeanByItems = critValidItemCount > 0 ? critSumItemWM / critValidItemCount : 0;

    // When a criterion has multiple sub-criteria (like Functional Suitability), using the average of sub-criteria matches the user's uploaded formula sheet (11.68 / 3 = 3.89)
    const primaryCritMean = subSummaries.length > 1 ? critMeanBySub : critMeanByItems;
    const critVI = getVerbalInterpretation(primaryCritMean, critValidItemCount > 0);

    // Update Criterion Card Footer & Header
    const elCritHMean = document.getElementById(`crit-header-mean-${crit.id}`);
    const elCritHBadge = document.getElementById(`crit-header-badge-${crit.id}`);
    const elCritN = document.getElementById(`crit-n-${crit.id}`);
    const elCritTWS = document.getElementById(`crit-tws-${crit.id}`);
    const elCritWM = document.getElementById(`crit-wm-${crit.id}`);
    const elCritVI = document.getElementById(`crit-vi-${crit.id}`);

    const avgCritN = critValidItemCount > 0 ? critTotalResponses / critValidItemCount : 0;

    if (elCritHMean) elCritHMean.textContent = `WM: ${primaryCritMean.toFixed(2)}`;
    if (elCritHBadge) {
      elCritHBadge.className = `badge ${critVI.badgeClass}`;
      elCritHBadge.textContent = critVI.label;
    }
    if (elCritN) elCritN.textContent = avgCritN > 0 ? (Number.isInteger(avgCritN) ? avgCritN : avgCritN.toFixed(1)) : "0";
    if (elCritTWS) {
      elCritTWS.textContent = subSummaries.length > 1
        ? `${sumSubWMs.toFixed(2)} (Sub-Criteria) / ${critSumItemWM.toFixed(2)} (Items)`
        : critSumItemWM.toFixed(2);
    }
    if (elCritWM) elCritWM.textContent = critValidItemCount > 0 ? primaryCritMean.toFixed(2) : "0.00";
    if (elCritVI) elCritVI.innerHTML = `<span class="badge ${critVI.badgeClass}">${critVI.label}</span>`;

    if (critValidItemCount > 0) {
      grandSumCriterionMeans += primaryCritMean;
      validCriteriaCount++;

      if (!bestCriterion || primaryCritMean > bestCriterion.mean) {
        bestCriterion = {
          code: crit.code,
          title: crit.shortTitle,
          mean: primaryCritMean,
          vi: critVI
        };
      }
    }

    criteriaSummaries.push({
      id: crit.id,
      code: crit.code,
      title: crit.title,
      shortTitle: crit.shortTitle,
      itemCount: crit.subcriteria.reduce((a, s) => a + s.questions.length, 0),
      subCount: crit.subcriteria.length,
      sumSubWMs,
      sumItemWMs: critSumItemWM,
      mean: primaryCritMean,
      hasData: critValidItemCount > 0,
      vi: critVI,
      subSummaries
    });
  });

  // Render Tab 2 Summary Tables
  renderSummaryTabTables(criteriaSummaries, allSubcriteriaSummaries);

  // Calculate SUS Table
  const susStats = calculateAndRenderSusStats();

  // Update Top KPI Strip
  const grandMean = validCriteriaCount > 0 ? grandSumCriterionMeans / validCriteriaCount : 0;
  const grandVI = getVerbalInterpretation(grandMean, validCriteriaCount > 0);

  document.getElementById("kpiOverallMean").textContent = validCriteriaCount > 0 ? grandMean.toFixed(2) : "0.00";
  const kpiOverallBadge = document.getElementById("kpiOverallBadge");
  kpiOverallBadge.className = `badge ${grandVI.badgeClass}`;
  kpiOverallBadge.textContent = grandVI.label;
  document.getElementById("kpiOverallSubtext").textContent =
    `Total Weighted Score (Sum of 8 Criteria): ${grandSumCriterionMeans.toFixed(2)} / ${validCriteriaCount || 8}`;

  const avgNOverall = countedItems > 0 ? totalItemN / countedItems : 0;
  document.getElementById("kpiRespondents").textContent = appState.targetN;
  document.getElementById("kpiRespondentsSubtext").textContent =
    `Active Avg N per item: ${Number.isInteger(avgNOverall) ? avgNOverall : avgNOverall.toFixed(1)}`;
  document.getElementById("kpiEncodedCountBadge").textContent =
    `${appState.encodedRespondents.length} Encoded Forms`;

  if (bestCriterion) {
    document.getElementById("kpiBestCriterionVal").textContent = `${bestCriterion.code}: ${bestCriterion.mean.toFixed(2)}`;
    const bestBadge = document.getElementById("kpiBestCriterionBadge");
    bestBadge.className = `badge ${bestCriterion.vi.badgeClass}`;
    bestBadge.textContent = bestCriterion.vi.label;
    document.getElementById("kpiBestCriterionName").textContent = bestCriterion.title;
  } else {
    document.getElementById("kpiBestCriterionVal").textContent = "—";
    const bestBadge = document.getElementById("kpiBestCriterionBadge");
    bestBadge.className = "badge badge-empty";
    bestBadge.textContent = "—";
    document.getElementById("kpiBestCriterionName").textContent = "Enter tallies to compute";
  }

  document.getElementById("kpiSusScore").textContent = susStats.hasData ? `${susStats.susScore100.toFixed(2)}` : "0.00";
  const susBadgeEl = document.getElementById("kpiSusBadge");
  susBadgeEl.className = `badge ${susStats.susGrade.badgeClass}`;
  susBadgeEl.textContent = susStats.hasData ? susStats.susGrade.shortLabel : "No Data";
  document.getElementById("kpiSusSubtext").textContent =
    `Likert WM: ${susStats.overallWM.toFixed(2)} (${susStats.likertVI.label})`;
}

// =========================================================================
// RENDER TAB 2: SUMMARY TABLES
// =========================================================================
function renderSummaryTabTables(criteriaSummaries, allSubcriteriaSummaries) {
  // 1. Table 1A: Functional Suitability Sub-Criteria Summary (Matches user's formula screenshot)
  const critA = criteriaSummaries.find(c => c.id === "A");
  const tbodyFunc = document.getElementById("tbodyFuncSuitabilitySummary");
  if (critA && tbodyFunc) {
    let htmlA = "";
    let totalAvgWS = 0;
    let sumWMs = 0;

    critA.subSummaries.forEach(sub => {
      totalAvgWS += sub.avgWS;
      sumWMs += sub.weightedMean;
      htmlA += `
        <tr>
          <td><strong>${sub.subTitle}</strong> <small style="color:var(--text-muted);">(${sub.itemCount} items)</small></td>
          <td class="num-col">${Number.isInteger(sub.avgF5) ? sub.avgF5 : sub.avgF5.toFixed(1)}</td>
          <td class="num-col">${Number.isInteger(sub.avgF4) ? sub.avgF4 : sub.avgF4.toFixed(1)}</td>
          <td class="num-col">${Number.isInteger(sub.avgF3) ? sub.avgF3 : sub.avgF3.toFixed(1)}</td>
          <td class="num-col">${Number.isInteger(sub.avgF2) ? sub.avgF2 : sub.avgF2.toFixed(1)}</td>
          <td class="num-col">${Number.isInteger(sub.avgF1) ? sub.avgF1 : sub.avgF1.toFixed(1)}</td>
          <td class="num-col">${Number.isInteger(sub.avgN) ? sub.avgN : sub.avgN.toFixed(1)}</td>
          <td class="num-col"><strong>${Number.isInteger(sub.avgWS) ? sub.avgWS : sub.avgWS.toFixed(2)}</strong></td>
          <td class="wm-cell">${sub.weightedMean.toFixed(2)}</td>
          <td class="num-col"><span class="badge ${sub.vi.badgeClass}">${sub.vi.label}</span></td>
        </tr>
      `;
    });

    const totalWM = critA.mean;
    const totalVI = critA.vi;

    htmlA += `
      <tr class="subcriterion-summary-row">
        <td colspan="7" style="text-align:right; padding-right:1rem;">
          <strong>Total Weighted Score (Sum of Weighted Scores / Sum of Weighted Means):</strong>
        </td>
        <td class="num-col"><strong>${Number.isInteger(totalAvgWS) ? totalAvgWS : totalAvgWS.toFixed(2)}</strong></td>
        <td class="wm-cell"><strong>${sumWMs.toFixed(2)}</strong></td>
        <td class="num-col"><small style="color:var(--text-muted);">Sum of 3 Indicators</small></td>
      </tr>
      <tr class="criterion-total-footer">
        <td colspan="8" style="text-align:right; padding-right:1rem;">
          <strong>Total Weighted Mean (General Average = ${sumWMs.toFixed(2)} / 3):</strong>
        </td>
        <td class="wm-cell" style="font-size:1.05rem;"><strong>${totalWM.toFixed(2)}</strong></td>
        <td class="num-col"><span class="badge ${totalVI.badgeClass}">${totalVI.label}</span></td>
      </tr>
    `;
    tbodyFunc.innerHTML = htmlA;
  }

  // 2. Table 1B: All Sub-Criteria Detailed Breakdown
  const tbodySubAll = document.getElementById("tbodySubcriteriaAll");
  if (tbodySubAll) {
    let htmlSub = "";
    allSubcriteriaSummaries.forEach(sub => {
      const pct = Math.min(100, (sub.weightedMean / 5) * 100);
      htmlSub += `
        <tr>
          <td><strong>${sub.critCode}. ${sub.critTitle}</strong></td>
          <td>${sub.subTitle}</td>
          <td class="num-col">${sub.itemCount}</td>
          <td class="num-col">${sub.sumItemWM.toFixed(2)}</td>
          <td class="wm-cell">${sub.weightedMean.toFixed(2)}</td>
          <td>
            <div class="chart-bar-wrap">
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width:${pct}%;"></div>
              </div>
              <small style="font-weight:700;">${pct.toFixed(0)}%</small>
            </div>
          </td>
          <td class="num-col"><span class="badge ${sub.vi.badgeClass}">${sub.vi.label}</span></td>
        </tr>
      `;
    });
    tbodySubAll.innerHTML = htmlSub;
  }

  // 3. Table 1C: Overall ISO 25010 Summary
  const tbodyOverall = document.getElementById("tbodyOverallIsoSummary");
  const tfootOverall = document.getElementById("tfootOverallIsoSummary");
  if (tbodyOverall && tfootOverall) {
    let htmlOv = "";
    let sumCritMeans = 0;
    let totalItemsAll = 0;
    let validCrits = 0;

    criteriaSummaries.forEach(c => {
      totalItemsAll += c.itemCount;
      if (c.hasData) {
        sumCritMeans += c.mean;
        validCrits++;
      }
      const pct = Math.min(100, (c.mean / 5) * 100);
      const twsDisplay = c.subCount > 1
        ? `${c.sumSubWMs.toFixed(2)} <small style="color:var(--text-muted);">(${c.subCount} sub-criteria)</small>`
        : `${c.sumItemWMs.toFixed(2)} <small style="color:var(--text-muted);">(${c.itemCount} items)</small>`;

      htmlOv += `
        <tr>
          <td class="q-num-cell">${c.code}</td>
          <td><strong>${c.shortTitle}</strong></td>
          <td class="num-col">${c.itemCount}</td>
          <td class="num-col">${twsDisplay}</td>
          <td class="wm-cell">${c.mean.toFixed(2)}</td>
          <td>
            <div class="chart-bar-wrap">
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width:${pct}%;"></div>
              </div>
              <small style="font-weight:700;">${c.mean.toFixed(2)}/5</small>
            </div>
          </td>
          <td class="num-col"><span class="badge ${c.vi.badgeClass}">${c.vi.label}</span></td>
        </tr>
      `;
    });

    const grandMean = validCrits > 0 ? sumCritMeans / validCrits : 0;
    const grandVI = getVerbalInterpretation(grandMean, validCrits > 0);

    tbodyOverall.innerHTML = htmlOv;
    tfootOverall.innerHTML = `
      <tr class="subcriterion-summary-row">
        <td colspan="2" style="text-align:right; padding-right:1rem;">
          <strong>TOTAL WEIGHTED SCORE (Sum of Criterion Weighted Means):</strong>
        </td>
        <td class="num-col"><strong>${totalItemsAll}</strong></td>
        <td class="num-col">—</td>
        <td class="wm-cell"><strong>${sumCritMeans.toFixed(2)}</strong></td>
        <td colspan="2"><small style="color:var(--text-muted);">Sum of ${validCrits} Criteria Means</small></td>
      </tr>
      <tr class="criterion-total-footer">
        <td colspan="4" style="text-align:right; padding-right:1rem;">
          <strong>OVERALL WEIGHTED MEAN / GENERAL AVERAGE (${sumCritMeans.toFixed(2)} / ${validCrits || 8}):</strong>
        </td>
        <td class="wm-cell" style="font-size:1.15rem;"><strong>${grandMean.toFixed(2)}</strong></td>
        <td>
          <div class="chart-bar-wrap">
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width:${Math.min(100, (grandMean / 5) * 100)}%;"></div>
            </div>
          </div>
        </td>
        <td class="num-col"><span class="badge ${grandVI.badgeClass}">${grandVI.label}</span></td>
      </tr>
    `;
  }
}

// =========================================================================
// CALCULATE & RENDER SUS TABLE
// =========================================================================
function calculateAndRenderSusStats() {
  let sumSusContrib = 0;
  let sumOddContrib = 0;
  let sumEvenContrib = 0;
  let sumLikertWM = 0;
  let validCount = 0;

  SUS_QUESTIONS.forEach(sq => {
    const stats = computeItemStats(appState.susTallies[sq.num]);
    const hasData = stats.totalN > 0;
    const vi = getVerbalInterpretation(stats.weightedMean, hasData);

    // Standard Brooke SUS contribution (0 to 4 scale per question):
    // Step 1: Odd (positive) items (1, 3, 5, 7, 9): WeightedMean - 1
    // Step 2: Even (negative) items (2, 4, 6, 8, 10): 5 - WeightedMean
    let contrib = 0;
    if (hasData) {
      if (sq.polarity === "positive") {
        contrib = stats.weightedMean - 1;
        sumOddContrib += contrib;
      } else {
        contrib = 5 - stats.weightedMean;
        sumEvenContrib += contrib;
      }
      sumSusContrib += contrib;
      sumLikertWM += stats.weightedMean;
      validCount++;
    }

    const elN = document.getElementById(`sus-n-${sq.num}`);
    const elWS = document.getElementById(`sus-ws-${sq.num}`);
    const elWM = document.getElementById(`sus-wm-${sq.num}`);
    const elContrib = document.getElementById(`sus-contrib-${sq.num}`);
    const elVI = document.getElementById(`sus-vi-${sq.num}`);

    if (elN) elN.textContent = stats.totalN;
    if (elWS) elWS.textContent = stats.weightedScore;
    if (elWM) elWM.textContent = hasData ? stats.weightedMean.toFixed(2) : "0.00";
    if (elContrib) elContrib.textContent = hasData ? contrib.toFixed(2) : "0.00";
    if (elVI) elVI.innerHTML = `<span class="badge ${vi.badgeClass}">${vi.label}</span>`;
  });

  const hasAllData = validCount > 0;
  const susScore100 = hasAllData ? sumSusContrib * 2.5 : 0;
  const overallWM = hasAllData ? sumLikertWM / validCount : 0;
  const likertVI = getVerbalInterpretation(overallWM, hasAllData);
  const susGrade = getSusGradeInterpretation(susScore100, hasAllData);

  const tfoot = document.getElementById("tfootSus");
  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="subcriterion-summary-row">
        <td colspan="10" style="text-align:right; padding-right:1rem;">
          <strong>Step 1 &amp; 2 Total Adjusted Score (0–40) &amp; General Likert Weighted Mean (1–5):</strong>
        </td>
        <td class="wm-cell"><strong>${overallWM.toFixed(2)}</strong> <small>(Sum: ${sumLikertWM.toFixed(2)})</small></td>
        <td class="num-col"><strong>&Sigma; = ${sumSusContrib.toFixed(2)} / 40</strong></td>
        <td class="num-col"><span class="badge ${likertVI.badgeClass}">${likertVI.label}</span></td>
      </tr>
      <tr class="criterion-total-footer">
        <td colspan="10" style="text-align:right; padding-right:1rem;">
          <strong>Step 4 &amp; 5: OVERALL SYSTEM USABILITY SCALE (SUS) SCORE (&Sigma; Adjusted ${sumSusContrib.toFixed(2)} &times; 2.5):</strong>
        </td>
        <td colspan="2" class="wm-cell" style="font-size:1.15rem;">
          <strong>${susScore100.toFixed(2)} / 100</strong>
        </td>
        <td class="num-col"><span class="badge ${susGrade.badgeClass}">${susGrade.label}</span></td>
      </tr>
    `;
  }

  // Update Live 5-Step SUS Breakdown Box (from UXtweak Guide)
  const stepBox = document.getElementById("susLiveStepBreakdown");
  if (stepBox) {
    const benchmarkComparison = susScore100 >= 68
      ? `<span style="color:var(--yellow-300); font-weight:800;">Above Industry Average (+${(susScore100 - 68).toFixed(2)} pts vs. 68 benchmark)</span>`
      : `<span style="color:#fca5a5; font-weight:800;">Below Industry Average (${(susScore100 - 68).toFixed(2)} pts vs. 68 benchmark)</span>`;

    stepBox.innerHTML = `
      <div style="margin-bottom:0.45rem;">
        <strong>Step 1 (Odd Items 1, 3, 5, 7, 9 — Positively Oriented):</strong>
        Subtract $1$ from each mean response $(\\text{WM} - 1)$ &rarr;
        <strong>Sum of Odd Adjusted Scores = ${sumOddContrib.toFixed(2)}</strong> <small>(out of 20)</small>
      </div>
      <div style="margin-bottom:0.45rem;">
        <strong>Step 2 (Even Items 2, 4, 6, 8, 10 — Negatively Oriented):</strong>
        Subtract each mean response from $5$ $(5 - \\text{WM})$ &rarr;
        <strong>Sum of Even Adjusted Scores = ${sumEvenContrib.toFixed(2)}</strong> <small>(out of 20)</small>
      </div>
      <div style="margin-bottom:0.45rem;">
        <strong>Step 3 (Sum All Adjusted Scores):</strong>
        $${sumOddContrib.toFixed(2)} + ${sumEvenContrib.toFixed(2)} =$
        <strong style="color:var(--yellow-300);">${sumSusContrib.toFixed(2)}</strong> <small>(Range: 0 to 40)</small>
      </div>
      <div style="margin-bottom:0.45rem;">
        <strong>Step 4 &amp; 5 (Multiply by 2.5 for Overall Average SUS Score):</strong>
        <div class="formula-math" style="margin:0.4rem 0;">
          SUS Score = ${sumSusContrib.toFixed(2)} &times; 2.5 = ${susScore100.toFixed(2)} / 100
        </div>
      </div>
      <div>
        <strong>Sauro &amp; Lewis (2016) Interpretation:</strong>
        Grade <strong>${susGrade.grade}</strong> &bull; Rank: <strong>${susGrade.rank}</strong> &bull; Percentile: <strong>${susGrade.percentile}</strong> &bull; ${benchmarkComparison}
      </div>
    `;
  }

  // Update Sauro & Lewis Curved Grading Scale Table with Active Row Highlight
  const tbodyGradeRef = document.getElementById("tbodySusGradeReference");
  if (tbodyGradeRef) {
    let matchedOnce = false;
    tbodyGradeRef.innerHTML = SUS_GRADE_SCALE.map(g => {
      const isMatch = hasAllData && !matchedOnce && susScore100 >= g.min;
      if (isMatch) matchedOnce = true;
      const rowStyle = isMatch
        ? `background: linear-gradient(90deg, var(--yellow-100), var(--green-100)); font-weight:800; outline: 2px solid var(--green-800);`
        : "";
      return `
        <tr style="${rowStyle}">
          <td class="num-col"><strong>${g.rangeLabel}</strong></td>
          <td class="num-col">${g.percentile}</td>
          <td class="num-col"><span class="badge ${g.badgeClass}">Grade ${g.grade}</span></td>
          <td>${g.rank}</td>
          <td class="num-col">
            ${isMatch ? `<span class="badge badge-vs">&#9733; ${susScore100.toFixed(2)} (Current)</span>` : "—"}
          </td>
        </tr>
      `;
    }).join("");
  }

  return {
    hasData: hasAllData,
    susScore100,
    overallWM,
    likertVI,
    susGrade
  };
}

// =========================================================================
// UXtweak SINGLE PARTICIPANT SUS SIMULATOR (Worked Example: Score = 75)
// =========================================================================
const UXTWEAK_EXAMPLE_ANSWERS = { 1: 5, 2: 5, 3: 4, 4: 1, 5: 3, 6: 1, 7: 3, 8: 2, 9: 5, 10: 1 };
let singleSusResponses = { ...UXTWEAK_EXAMPLE_ANSWERS };

function initSingleParticipantSusSim() {
  const tbody = document.getElementById("tbodySusSingleSim");
  if (!tbody) return;

  let html = "";
  SUS_QUESTIONS.forEach(sq => {
    const val = singleSusResponses[sq.num] || 3;
    const ruleText = sq.polarity === "positive"
      ? `<span style="color:var(--green-800); font-weight:700;">Odd (+): Response &minus; 1</span>`
      : `<span style="color:#92400e; font-weight:700;">Even (&minus;): 5 &minus; Response</span>`;

    html += `
      <tr>
        <td class="q-num-cell">${sq.num}</td>
        <td>${ruleText}</td>
        <td class="num-col">
          <input type="number" min="1" max="5" class="freq-input single-sus-sim-input" data-sq="${sq.num}" value="${val}" />
        </td>
        <td class="wm-cell" id="single-sus-adj-${sq.num}">0</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;

  tbody.querySelectorAll(".single-sus-sim-input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const q = parseInt(e.target.getAttribute("data-sq"), 10);
      let v = parseInt(e.target.value, 10);
      if (isNaN(v)) v = 1;
      v = Math.max(1, Math.min(5, v));
      singleSusResponses[q] = v;
      updateSingleParticipantSusSim();
    });
  });

  const btnEx = document.getElementById("btnLoadUxtweakExample");
  if (btnEx) {
    btnEx.onclick = () => {
      singleSusResponses = { ...UXTWEAK_EXAMPLE_ANSWERS };
      tbody.querySelectorAll(".single-sus-sim-input").forEach(inp => {
        const q = parseInt(inp.getAttribute("data-sq"), 10);
        inp.value = singleSusResponses[q];
      });
      updateSingleParticipantSusSim();
    };
  }

  updateSingleParticipantSusSim();
}

function updateSingleParticipantSusSim() {
  let totalAdj = 0;
  SUS_QUESTIONS.forEach(sq => {
    const resp = singleSusResponses[sq.num] || 1;
    const adj = sq.polarity === "positive" ? (resp - 1) : (5 - resp);
    totalAdj += adj;
    const el = document.getElementById(`single-sus-adj-${sq.num}`);
    if (el) {
      el.innerHTML = sq.polarity === "positive"
        ? `<small style="color:var(--text-muted);">(${resp}&minus;1) =</small> <strong>${adj}</strong>`
        : `<small style="color:var(--text-muted);">(5&minus;${resp}) =</small> <strong>${adj}</strong>`;
    }
  });

  const finalSus = totalAdj * 2.5;
  const gradeInfo = getSusGradeInterpretation(finalSus, true);
  const tfoot = document.getElementById("tfootSusSingleSim");
  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="subcriterion-summary-row">
        <td colspan="3" style="text-align:right; padding-right:1rem;"><strong>Step 3: Total Adjusted Score (0–40):</strong></td>
        <td class="wm-cell"><strong>${totalAdj}</strong></td>
      </tr>
      <tr class="criterion-total-footer">
        <td colspan="3" style="text-align:right; padding-right:1rem;"><strong>Step 4: Participant SUS Score (${totalAdj} &times; 2.5):</strong></td>
        <td class="wm-cell" style="font-size:1.05rem;">
          <strong>${finalSus.toFixed(1)}</strong>
          <div style="margin-top:0.2rem;"><span class="badge ${gradeInfo.badgeClass}">${gradeInfo.shortLabel}</span></div>
        </td>
      </tr>
    `;
  }
}

// =========================================================================
// TAB 5: INDIVIDUAL RESPONDENT ENCODER
// =========================================================================
function initIndividualEncoder() {
  const selAge = document.getElementById("encAge");
  const selSex = document.getElementById("encSex");
  const selRole = document.getElementById("encRole");

  selAge.innerHTML = DEMOGRAPHIC_CONFIG.age.map(a => `<option value="${a.id}">${a.label}</option>`).join("");
  selSex.innerHTML = DEMOGRAPHIC_CONFIG.sex.map(s => `<option value="${s.id}">${s.label}</option>`).join("");
  selRole.innerHTML = DEMOGRAPHIC_CONFIG.role.map(r => `<option value="${r.id}">${r.label}</option>`).join("");

  const container = document.getElementById("encoderQuestionsContainer");
  let html = `
    <div class="table-responsive" style="max-height:520px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
      <table class="eval-table">
        <thead>
          <tr>
            <th class="q-num-cell">#</th>
            <th>Question Statement</th>
            <th class="num-col" style="width:220px;">Select Rating (5 to 1)</th>
          </tr>
        </thead>
        <tbody>
  `;

  ISO_CRITERIA.forEach(crit => {
    html += `
      <tr class="subcriterion-banner-row">
        <td colspan="3">${crit.title}</td>
      </tr>
    `;
    crit.subcriteria.forEach(sub => {
      sub.questions.forEach(q => {
        html += `
          <tr>
            <td class="q-num-cell">${q.num}</td>
            <td>${q.text}</td>
            <td class="num-col">
              <div class="radio-scale-group">
                ${[5, 4, 3, 2, 1].map(score => `
                  <label class="radio-pill">
                    <input type="radio" name="enc_iso_${q.num}" value="${score}" ${score === 4 ? "checked" : ""} />
                    <span>${score}</span>
                  </label>
                `).join("")}
              </div>
            </td>
          </tr>
        `;
      });
    });
  });

  html += `
    <tr class="subcriterion-banner-row">
      <td colspan="3">TABLE 2: SYSTEM USABILITY SCALE (SUS)</td>
    </tr>
  `;

  SUS_QUESTIONS.forEach(sq => {
    const defScore = sq.polarity === "positive" ? 4 : 2;
    html += `
      <tr>
        <td class="q-num-cell">SUS ${sq.num}</td>
        <td>${sq.text}</td>
        <td class="num-col">
          <div class="radio-scale-group">
            ${[5, 4, 3, 2, 1].map(score => `
              <label class="radio-pill">
                <input type="radio" name="enc_sus_${sq.num}" value="${score}" ${score === defScore ? "checked" : ""} />
                <span>${score}</span>
              </label>
            `).join("")}
          </div>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;

  renderEncodedRespondentsLog();
}

window.quickFillEncoder = function(scoreVal) {
  for (let q = 1; q <= 65; q++) {
    const radio = document.querySelector(`input[name="enc_iso_${q}"][value="${scoreVal}"]`);
    if (radio) radio.checked = true;
  }
  SUS_QUESTIONS.forEach(sq => {
    const target = sq.polarity === "positive" ? scoreVal : (6 - scoreVal);
    const radio = document.querySelector(`input[name="enc_sus_${sq.num}"][value="${target}"]`);
    if (radio) radio.checked = true;
  });
};

window.quickFillEncoderRandom = function() {
  for (let q = 1; q <= 65; q++) {
    const r = Math.random();
    const score = r < 0.35 ? 5 : (r < 0.85 ? 4 : 3);
    const radio = document.querySelector(`input[name="enc_iso_${q}"][value="${score}"]`);
    if (radio) radio.checked = true;
  }
  SUS_QUESTIONS.forEach(sq => {
    const r = Math.random();
    const posScore = r < 0.35 ? 5 : (r < 0.85 ? 4 : 3);
    const score = sq.polarity === "positive" ? posScore : (6 - posScore);
    const radio = document.querySelector(`input[name="enc_sus_${sq.num}"][value="${score}"]`);
    if (radio) radio.checked = true;
  });
};

function submitIndividualRespondent() {
  const nameInput = document.getElementById("encName");
  const ageId = document.getElementById("encAge").value;
  const sexId = document.getElementById("encSex").value;
  const roleId = document.getElementById("encRole").value;

  const isoAnswers = {};
  let sumIso = 0;
  for (let q = 1; q <= 65; q++) {
    const checked = document.querySelector(`input[name="enc_iso_${q}"]:checked`);
    const score = checked ? parseInt(checked.value, 10) : 4;
    isoAnswers[q] = score;
    sumIso += score;
    appState.isoTallies[q][score] = (appState.isoTallies[q][score] || 0) + 1;
  }

  const susAnswers = {};
  let susContrib = 0;
  SUS_QUESTIONS.forEach(sq => {
    const checked = document.querySelector(`input[name="enc_sus_${sq.num}"]:checked`);
    const score = checked ? parseInt(checked.value, 10) : 3;
    susAnswers[sq.num] = score;
    appState.susTallies[sq.num][score] = (appState.susTallies[sq.num][score] || 0) + 1;
    susContrib += sq.polarity === "positive" ? (score - 1) : (5 - score);
  });

  appState.demographics.age[ageId] = (appState.demographics.age[ageId] || 0) + 1;
  appState.demographics.sex[sexId] = (appState.demographics.sex[sexId] || 0) + 1;
  appState.demographics.role[roleId] = (appState.demographics.role[roleId] || 0) + 1;

  const newResp = {
    id: Date.now(),
    name: nameInput.value.trim() || `Respondent #${appState.encodedRespondents.length + 1}`,
    ageId,
    sexId,
    roleId,
    isoAnswers,
    susAnswers,
    isoMean: sumIso / 65,
    susScore: susContrib * 2.5
  };

  appState.encodedRespondents.push(newResp);
  nameInput.value = "";
  saveState();
  renderAll();
  alert(`Added "${newResp.name}" to the Master Tally!\n• Respondent ISO Mean: ${newResp.isoMean.toFixed(2)}\n• Respondent SUS Score: ${newResp.susScore.toFixed(2)}`);
}

window.removeEncodedRespondent = function(respId) {
  const idx = appState.encodedRespondents.findIndex(r => r.id === respId);
  if (idx === -1) return;
  const resp = appState.encodedRespondents[idx];

  for (let q = 1; q <= 65; q++) {
    const sc = resp.isoAnswers[q];
    if (sc && appState.isoTallies[q][sc] > 0) {
      appState.isoTallies[q][sc]--;
    }
  }
  SUS_QUESTIONS.forEach(sq => {
    const sc = resp.susAnswers[sq.num];
    if (sc && appState.susTallies[sq.num][sc] > 0) {
      appState.susTallies[sq.num][sc]--;
    }
  });

  if (appState.demographics.age[resp.ageId] > 0) appState.demographics.age[resp.ageId]--;
  if (appState.demographics.sex[resp.sexId] > 0) appState.demographics.sex[resp.sexId]--;
  if (appState.demographics.role[resp.roleId] > 0) appState.demographics.role[resp.roleId]--;

  appState.encodedRespondents.splice(idx, 1);
  saveState();
  renderAll();
};

function renderEncodedRespondentsLog() {
  const tbody = document.getElementById("tbodyEncodedLog");
  const badge = document.getElementById("encodedLogCount");
  if (!tbody) return;

  badge.textContent = `${appState.encodedRespondents.length} Respondents`;

  if (appState.encodedRespondents.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; color:var(--text-muted); padding:1.5rem;">
          No individual forms submitted yet. You can either type total tallies directly in Tab 1, or encode individual sheets here.
        </td>
      </tr>
    `;
    return;
  }

  const getLabel = (grp, id) => {
    const found = DEMOGRAPHIC_CONFIG[grp].find(x => x.id === id);
    return found ? found.label : id;
  };

  tbody.innerHTML = appState.encodedRespondents.map((r, i) => `
    <tr>
      <td class="q-num-cell">${i + 1}</td>
      <td><strong>${r.name}</strong></td>
      <td>${getLabel("age", r.ageId)}</td>
      <td>${getLabel("sex", r.sexId)}</td>
      <td>${getLabel("role", r.roleId)}</td>
      <td class="wm-cell">${r.isoMean.toFixed(2)}</td>
      <td class="num-col"><strong>${r.susScore.toFixed(2)}</strong></td>
      <td class="num-col">
        <button class="btn btn-danger-outline" style="padding:0.25rem 0.55rem; font-size:0.75rem;" onclick="removeEncodedRespondent(${r.id})">
          Remove
        </button>
      </td>
    </tr>
  `).join("");
}

// =========================================================================
// EXPORT CSV / JSON / COPY HELPERS
// =========================================================================
function exportToCSV() {
  let lines = [];
  lines.push('"CHARRMPASS: Automated System Evaluation & Survey Calculator Report"');
  lines.push('"Aklan State University - Ibajay Campus"');
  lines.push("");

  // Section 1: ISO 25010 Detailed Items
  lines.push('"TABLE 1: ISO/IEC 25010 DETAILED ITEM TALLY & WEIGHTED MEAN"');
  lines.push('"Criterion","Sub-Criterion","Item #","Statement","Score 5","Score 4","Score 3","Score 2","Score 1","Total N","Weighted Score","Weighted Mean","Verbal Interpretation"');

  ISO_CRITERIA.forEach(crit => {
    crit.subcriteria.forEach(sub => {
      sub.questions.forEach(q => {
        const st = computeItemStats(appState.isoTallies[q.num]);
        const vi = getVerbalInterpretation(st.weightedMean, st.totalN > 0);
        const safeText = q.text.replace(/"/g, '""');
        lines.push(`"${crit.title}","${sub.title}",${q.num},"${safeText}",${st.f5},${st.f4},${st.f3},${st.f2},${st.f1},${st.totalN},${st.weightedScore},${st.weightedMean.toFixed(2)},"${vi.label}"`);
      });
    });
  });

  lines.push("");
  lines.push('"TABLE 2: SYSTEM USABILITY SCALE (SUS)"');
  lines.push('"Item #","Statement","Polarity","Score 5","Score 4","Score 3","Score 2","Score 1","Total N","Weighted Score","Weighted Mean","SUS Contribution","Verbal Interpretation"');

  SUS_QUESTIONS.forEach(sq => {
    const st = computeItemStats(appState.susTallies[sq.num]);
    const vi = getVerbalInterpretation(st.weightedMean, st.totalN > 0);
    const contrib = st.totalN > 0 ? (sq.polarity === "positive" ? st.weightedMean - 1 : 5 - st.weightedMean) : 0;
    const safeText = sq.text.replace(/"/g, '""');
    lines.push(`${sq.num},"${safeText}","${sq.polarity}",${st.f5},${st.f4},${st.f3},${st.f2},${st.f1},${st.totalN},${st.weightedScore},${st.weightedMean.toFixed(2)},${contrib.toFixed(2)},"${vi.label}"`);
  });

  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CHARRMPASS_Evaluation_Results.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportToJSON() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CHARRMPASS_Evaluation_Backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// =========================================================================
// FULL RENDER & EVENT BINDINGS
// =========================================================================
function renderAll() {
  document.getElementById("inputTargetN").value = appState.targetN;
  buildIsoFilterPills();
  renderIsoTables();
  renderSusTable();
  renderDemographicsTables();
  renderEncodedRespondentsLog();
  recalculateAndUpdateUI();
}

document.addEventListener("DOMContentLoaded", () => {
  loadState();

  // Tab switching
  document.querySelectorAll(".nav-tab").forEach(tabBtn => {
    tabBtn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tabBtn.classList.add("active");
      const targetId = tabBtn.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
    });
  });

  initIndividualEncoder();
  renderAll();

  // Top Header Buttons
  document.getElementById("btnLoadSample").addEventListener("click", () => {
    loadRealisticSampleData(true);
  });

  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all tallies back to zero?")) {
      appState = createEmptyState();
      saveState();
      renderAll();
    }
  });

  document.getElementById("btnExportCSV").addEventListener("click", exportToCSV);
  document.getElementById("btnExportJSON").addEventListener("click", exportToJSON);

  document.getElementById("inputImportJSON").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
        loadState();
        renderAll();
        alert("Successfully imported evaluation data!");
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  // Target N input & auto-balance
  document.getElementById("inputTargetN").addEventListener("input", (e) => {
    appState.targetN = Math.max(1, parseInt(e.target.value, 10) || 50);
    saveState();
    recalculateAndUpdateUI();
  });

  document.getElementById("btnAutoBalanceN").addEventListener("click", () => {
    const target = appState.targetN;
    for (let q = 1; q <= 65; q++) {
      const t = appState.isoTallies[q];
      const curr = (t[5] || 0) + (t[4] || 0) + (t[3] || 0) + (t[2] || 0) + (t[1] || 0);
      if (curr < target) {
        t[4] = (t[4] || 0) + (target - curr);
      }
    }
    saveState();
    renderAll();
  });

  // Submit Individual Respondent buttons
  document.getElementById("btnSubmitRespondent").addEventListener("click", submitIndividualRespondent);
  document.getElementById("btnSubmitRespondentBottom").addEventListener("click", submitIndividualRespondent);

  // Copy Summary Tables to Clipboard
  document.getElementById("btnCopySummaryTables").addEventListener("click", () => {
    const t1 = document.getElementById("tableFuncSuitabilitySummary").innerText;
    const t2 = document.getElementById("tableSubcriteriaAll").innerText;
    const t3 = document.getElementById("tableOverallIsoSummary").innerText;
    navigator.clipboard.writeText(`${t1}\n\n${t2}\n\n${t3}`).then(() => {
      alert("Summary tables copied to clipboard! You can now paste them into Word, Excel, or Google Docs.");
    });
  });
});
