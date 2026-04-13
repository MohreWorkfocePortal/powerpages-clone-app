document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const CSV_URL = "./annual.csv";
  const FETCH_FLOW_URL =
    "https://defaultbcb663ac7e41496bb17757c08849b2.30.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0f89554ef20848b284ab357e7df733a8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UXSqcLX4jvzH2jpxos-Fr8L0ZeRtmfhjW5vIW3KliCk";

  const STATUS_COMPLETED = "Completed";

  const SLOT_PLAN_PCT = {
    All:          { Jan:10.00, Feb:7.00, Mar:7.00, Apr:9.00, May:9.00, Jun:8.00, Jul:8.50, Aug:9.00, Sep:9.00, Oct:8.50, Nov:9.00, Dec:9.00 },
    Voice:        { Jan:10.00, Feb:7.00, Mar:7.00, Apr:9.00, May:9.00, Jun:8.00, Jul:8.50, Aug:9.00, Sep:9.00, Oct:8.50, Nov:9.00, Dec:9.00 },
    Technical:    { Jan:10.00, Feb:7.00, Mar:7.00, Apr:9.00, May:9.00, Jun:8.00, Jul:8.50, Aug:9.00, Sep:9.00, Oct:8.50, Nov:9.00, Dec:9.00 },
    Kiosk:        { Jan:10.00, Feb:7.00, Mar:7.00, Apr:9.00, May:9.00, Jun:8.00, Jul:8.50, Aug:9.00, Sep:9.00, Oct:8.50, Nov:9.00, Dec:9.00 },
    "Email/Chat": { Jan:10.00, Feb:7.00, Mar:7.00, Apr:9.00, May:9.00, Jun:8.00, Jul:8.50, Aug:9.00, Sep:9.00, Oct:8.50, Nov:9.00, Dec:9.00 },
    VIP:          { Jan:10.00, Feb:7.00, Mar:7.00, Apr:9.00, May:9.00, Jun:8.00, Jul:8.50, Aug:9.00, Sep:9.00, Oct:8.50, Nov:9.00, Dec:9.00 }
  };

  const MONTH_KEYS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONTH_DAYS = { Jan:31, Feb:28, Mar:31, Apr:30, May:31, Jun:30, Jul:31, Aug:31, Sep:30, Oct:31, Nov:30, Dec:31 };

  const $ = (id) => document.getElementById(id);

  const btnCsvView = $("btnCsvView");
  const btnLiveView = $("btnLiveView");

  const alEmp = $("alEmp");
  const alChannel = $("alChannel");
  const alRep = $("alRep");
  const statusEl = $("alStatus");

  const colgroup = $("alColgroup");
  const thead = $("alThead");
  const tbody = $("alTbody");
  const tfoot = $("alTfoot");

  const btnRefresh = $("btnRefresh");
  const btnViewSummary = $("btnViewSummary");
  const btnSlotStatus = $("btnSlotStatus");
  const btnExport = $("btnExport");

  const kpiCreditYTD = $("kpiCreditYTD");
  const kpiCredit = $("kpiCredit");
  const kpiDebit = $("kpiDebit");
  const kpiPrevYearTitle = $("kpiPrevYearTitle");
  const kpiPrevYearDebit = $("kpiPrevYearDebit");
  const kpiUPL = $("kpiUPL");

  const modalBackdrop = $("alModalBackdrop");
  const modalClose = $("alModalClose");
  const mEmp = $("mEmp");
  const mChannel = $("mChannel");
  const summaryThead = $("summaryThead");
  const summaryTbody = $("summaryTbody");

  const tableWrap = $("alDataViewport");
  const bottomScroll = $("alBottomScroll");
  const bottomScrollInner = $("alBottomScrollInner");
  const alphaBar = $("alAlphaBar");

  const slotModalBackdrop = $("slotModalBackdrop");
  const slotModalClose = $("slotModalClose");
  const slotInfo = $("slotInfo");
  const slotThead = $("slotThead");
  const slotTbody = $("slotTbody");
  const btnSlotSendEmail = $("btnSlotSendEmail");
  const slotButtons = Array.from(document.querySelectorAll(".slot-filter-btn"));
  const slotPlanTitle = $("slotPlanTitle");
  const slotPlanThead = $("slotPlanThead");
  const slotPlanTbody = $("slotPlanTbody");

  const esc = (v) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const trim = (v) => String(v ?? "").trim();
  const norm = (s) => trim(s).toLowerCase();

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"' && inQuotes && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(cur);
        cur = "";
      } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && next === "\n") i++;
        row.push(cur);
        cur = "";
        if (row.some((c) => c.trim() !== "")) rows.push(row);
        row = [];
      } else {
        cur += ch;
      }
    }

    if (cur.length || row.length) {
      row.push(cur);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
    }
    return rows;
  }

  function parseJsonSafe(raw) {
    if (!raw) return {};
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return {};
    }
  }

  function uniqueSorted(arr) {
    return Array.from(
      new Set(arr.filter((x) => x && String(x).trim() !== "").map((x) => String(x).trim()))
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  function setOptions(selectEl, values) {
    const current = selectEl.value || "All";
    selectEl.innerHTML = "";

    const optAll = document.createElement("option");
    optAll.value = "All";
    optAll.textContent = "All";
    selectEl.appendChild(optAll);

    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      selectEl.appendChild(o);
    });

    const exists = Array.from(selectEl.options).some((o) => o.value === current);
    selectEl.value = exists ? current : "All";
  }

  function toNumber(v) {
    const n = parseFloat(String(v ?? "").trim().replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function round0(n) {
    return Math.round(Number(n) || 0);
  }

  function round1(n) {
    return Math.round((Number(n) || 0) * 10) / 10;
  }

  function buildHeaderIndex(headers) {
    const idx = {};
    headers.forEach((h, i) => {
      idx[norm(String(h ?? "").replace("\ufeff", ""))] = i;
    });
    return idx;
  }

  function findColIndex(headerIndex, aliasList) {
    for (const a of aliasList) {
      const key = norm(a);
      if (key in headerIndex) return headerIndex[key];
    }
    const keys = Object.keys(headerIndex);
    for (const a of aliasList) {
      const aN = norm(a);
      const match = keys.find((hk) => hk.includes(aN));
      if (match) return headerIndex[match];
    }
    return -1;
  }

  function normalizeStoredStatus(status) {
    const s = norm(status);
    if (!s) return "";
    if (s.includes("completed")) return "Completed";
    if (s.includes("approved")) return "Completed";
    if (s.includes("rejected by supervisor")) return "Rejected by Supervisor";
    if (s.includes("rejected by wfm")) return "Rejected by WFM";
    if (s.includes("pending wfm")) return "Pending WFM";
    if (s.includes("pending supervisor")) return "Pending Supervisor";
    if (s.includes("pending")) return "Pending";
    return trim(status);
  }

  function parseDateHeader(h) {
    const raw = String(h ?? "").trim().replace("\ufeff", "");

    let m = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const monStr = m[2].toLowerCase();
      const yy = parseInt(m[3], 10);
      const monthMap = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
      if (!(monStr in monthMap)) return null;
      const dt = new Date(2000 + yy, monthMap[monStr], day);
      dt.setHours(0,0,0,0);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const dt = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
      dt.setHours(0,0,0,0);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    return null;
  }

  function formatHeaderKeyFromDate(d, sampleStyle) {
    const dt = new Date(d);
    dt.setHours(0,0,0,0);

    if (sampleStyle === "slash") {
      return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
    }

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dd = String(dt.getDate()).padStart(2, "0");
    const mon = months[dt.getMonth()];
    const yy = String(dt.getFullYear()).slice(-2);
    return `${dd}-${mon}-${yy}`;
  }

  function headerDateStyleFromColumns(cols) {
    const sample = cols.find((x) => x && parseDateHeader(x));
    if (!sample) return "dash";
    return sample.includes("/") ? "slash" : "dash";
  }

  function weekdayName(d) {
    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
  }

  function monthShortName(monthIndex) {
    return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][monthIndex];
  }

  function dateToISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function isoToDate(v) {
    const d = new Date(v);
    d.setHours(0,0,0,0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function eachDayInclusive(startDate, endDate, cb) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    s.setHours(0,0,0,0);
    e.setHours(0,0,0,0);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      cb(new Date(d));
    }
  }

  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function startsWithAlpha(name, alpha) {
    const first = trim(name).charAt(0).toUpperCase();
    if (alpha === "ALL") return true;
    if (alpha === "#") return !/[A-Z]/.test(first);
    return first === alpha;
  }

  let currentView = "live";
  let selectedAlpha = "ALL";

  let headers = [];
  let headerIndex = {};
  let allRows = [];
  let dateCols = [];
  let dateKeySet = new Set();
  let dateHeaderStyle = "dash";

  let currentRows = [];
  let currentDateCols = [];

  let idxEmp = -1, idxChannel = -1, idxRep = -1;
  let idxEmpId = -1, idxEmpName = -1, idxJob = -1, idxActivation = -1, idxJoining = -1;
  let idxSpokenLanguages = -1;

  let idxALCreditYTD = -1;
  let idxALCredit = -1;
  let idxALDebit = -1;
  let idxUPL = -1;

  let idxPrevYearBalance = -1;
  let prevYear = new Date().getFullYear() - 1;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const currentYear = today.getFullYear();
  const jan1 = new Date(currentYear, 0, 1);
  const mar31 = new Date(currentYear, 2, 31, 23, 59, 59);

  let slotActiveFilter = "All";

  const aliases = {
    emp: ["employee name", "employee nam", "agent name", "name"],
    channel: ["channel"],
    rep: ["report to", "reporting to", "reportingto", "reporting", "reportto"],
    empId: ["employee id"],
    activation: ["activation"],
    joining: ["joining date"],
    job: ["job title", "job"],
    spokenLanguages: ["spoken languages", "spoken language", "languages", "language"],
    alCreditYTD: ["al credit till now with 2.0 and 2.5", "al credit till now", "al credit ytd"],
    alCredit: ["al credit"],
    alDebit: ["al debit"],
    upl: ["upl", "unpaid leave"]
  };

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  async function loadCsvData() {
    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`annual.csv fetch failed: ${res.status} ${res.statusText}`);

    const text = await res.text();
    const grid = parseCSV(text);
    if (grid.length < 2) throw new Error("annual.csv has no data rows.");

    headers = grid[0].map(h => (h ?? "").trim());
    allRows = grid.slice(1);

    headerIndex = buildHeaderIndex(headers);

    idxEmp = findColIndex(headerIndex, aliases.emp);
    idxChannel = findColIndex(headerIndex, aliases.channel);
    idxRep = findColIndex(headerIndex, aliases.rep);

    idxEmpId = findColIndex(headerIndex, aliases.empId);
    idxEmpName = findColIndex(headerIndex, aliases.emp);
    idxJob = findColIndex(headerIndex, aliases.job);
    idxActivation = findColIndex(headerIndex, aliases.activation);
    idxJoining = findColIndex(headerIndex, aliases.joining);
    idxSpokenLanguages = findColIndex(headerIndex, aliases.spokenLanguages);

    idxALCreditYTD = findColIndex(headerIndex, aliases.alCreditYTD);
    idxALCredit = findColIndex(headerIndex, aliases.alCredit);
    idxALDebit = findColIndex(headerIndex, aliases.alDebit);
    idxUPL = findColIndex(headerIndex, aliases.upl);

    const prevColName = `${prevYear} Debit`;
    kpiPrevYearTitle.textContent = `Total ${prevYear} Debit`;
    idxPrevYearBalance = findColIndex(headerIndex, [prevColName]);

    dateCols = [];
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i] ?? "").trim().replace("\ufeff", "");
      const d = parseDateHeader(h);
      if (!d || Number.isNaN(d.getTime())) continue;
      dateCols.push({
        idx: i,
        header: h,
        dateObj: d,
        weekday: weekdayName(d),
        monthIndex: d.getMonth(),
        dayOfMonth: d.getDate()
      });
    }

    dateHeaderStyle = headerDateStyleFromColumns(dateCols.map(x => x.header));
    dateKeySet = new Set(dateCols.map(x => dateToISO(x.dateObj)));
  }

  function findBaseRowByEmployee(name, genesysId) {
    const g = trim(genesysId);
    const n = norm(name);

    if (g && idxEmpId >= 0) {
      const hit = allRows.find(r => trim(r[idxEmpId]) === g);
      if (hit) return hit;
    }
    if (n && idxEmpName >= 0) {
      const hit = allRows.find(r => norm(r[idxEmpName]) === n);
      if (hit) return hit;
    }
    return null;
  }

  async function fetchRequests() {
    const res = await fetch(FETCH_FLOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.requests)) {
      throw new Error("Flow response does not contain requests array.");
    }

    return data.requests.map((item) => ({
      ...item,
      payload: parseJsonSafe(item.payloadJson),
      normalizedStatus: normalizeStoredStatus(item.status)
    }));
  }

  function applyLiveAnnualRequests(baseRows) {
    const liveRowsMap = new Map();

    baseRows.forEach((row, rowIndex) => {
      const cells = {};
      dateCols.forEach(dc => {
        cells[dateToISO(dc.dateObj)] = trim(row[dc.idx] ?? "");
      });

      const rowKey =
        (idxEmpId >= 0 ? trim(row[idxEmpId]) : "") ||
        `name:${idxEmpName >= 0 ? norm(row[idxEmpName]) : rowIndex}`;

      liveRowsMap.set(rowKey, {
        rowKey,
        baseRow: row,
        cells,
        liveFlags: {}
      });
    });

    function getLiveRowByEmployee(employeeName, genesysId) {
      const base = findBaseRowByEmployee(employeeName, genesysId);
      if (!base) return null;
      const rowKey =
        (idxEmpId >= 0 ? trim(base[idxEmpId]) : "") ||
        `name:${idxEmpName >= 0 ? norm(base[idxEmpName]) : ""}`;
      return liveRowsMap.get(rowKey) || null;
    }

    function setALRange(liveRow, startVal, endVal) {
      if (!liveRow) return;
      const s = isoToDate(startVal) || parseDateHeader(startVal);
      const e = isoToDate(endVal) || parseDateHeader(endVal);
      if (!s || !e || e < s) return;

      eachDayInclusive(s, e, (d) => {
        const iso = dateToISO(d);
        if (!dateKeySet.has(iso)) return;
        liveRow.cells[iso] = "AL";
        liveRow.liveFlags[iso] = true;
      });
    }

    function clearALRange(liveRow, startVal, endVal) {
      if (!liveRow) return;
      const s = isoToDate(startVal) || parseDateHeader(startVal);
      const e = isoToDate(endVal) || parseDateHeader(endVal);
      if (!s || !e || e < s) return;

      eachDayInclusive(s, e, (d) => {
        const iso = dateToISO(d);
        if (!dateKeySet.has(iso)) return;

        const headerKey = formatHeaderKeyFromDate(d, dateHeaderStyle);
        const dc = dateCols.find(x => x.header === headerKey || sameDay(x.dateObj, d));
        if (!dc) return;

        const baseVal = trim(liveRow.baseRow[dc.idx] ?? "");
        liveRow.cells[iso] = baseVal;
        delete liveRow.liveFlags[iso];
      });
    }

    return fetchRequests().then((requests) => {
      const completed = requests.filter(r => r.normalizedStatus === STATUS_COMPLETED);

      completed.forEach((req) => {
        const reqType = norm(req.requestType || req.payload?.type || req.payload?.payload?.type || "");

        if (reqType === "annual leave request") {
          const p0 = req.payload || {};
          const p = p0.payload || p0;
          const liveRow = getLiveRowByEmployee(p.employeeName, p.genesysId);
          setALRange(liveRow, p.startDate, p.endDate);
          return;
        }

        if (reqType === "annual leave change") {
          const p0 = req.payload || {};
          const p = p0.payload || p0;
          const liveRow = getLiveRowByEmployee(p.employeeName, p.genesysId);
          clearALRange(liveRow, p.currentStartDate, p.currentEndDate);
          setALRange(liveRow, p.newStartDate, p.newEndDate);
          return;
        }

        if (reqType === "annual leave swap") {
          const p0 = req.payload || {};
          const p = p0.payload || p0;

          const a = p.employeeA || {};
          const b = p.employeeB || {};

          const rowA = getLiveRowByEmployee(a.employeeName, a.genesysId);
          const rowB = getLiveRowByEmployee(b.employeeName, b.genesysId);

          clearALRange(rowA, a.startDate, a.endDate);
          clearALRange(rowB, b.startDate, b.endDate);

          setALRange(rowA, b.startDate, b.endDate);
          setALRange(rowB, a.startDate, a.endDate);
        }
      });

      return Array.from(liveRowsMap.values());
    });
  }

  function buildFilterValues() {
    const source = currentRows;
    const empVals = idxEmp >= 0 ? uniqueSorted(source.map((r) => currentView === "live" ? r.employeeName : r[idxEmp])) : [];
    const chVals  = idxChannel >= 0 ? uniqueSorted(source.map((r) => currentView === "live" ? r.channel : r[idxChannel])) : [];
    const repVals = idxRep >= 0 ? uniqueSorted(source.map((r) => currentView === "live" ? r.reportingTo : r[idxRep])) : [];

    setOptions(alEmp, empVals);
    setOptions(alChannel, chVals);
    setOptions(alRep, repVals);
  }

  function isActiveCsvRow(row) {
    const v = String(row[idxActivation] ?? "").trim();
    return v === "Active";
  }

  function isActiveCurrentRow(row) {
    return currentView === "live" ? row.activation === "Active" : isActiveCsvRow(row);
  }

  function applyFiltersBase(rows) {
    const vEmp = alEmp.value;
    const vChannel = alChannel.value;
    const vRep = alRep.value;

    return rows.filter((r) => {
      const empVal = currentView === "live" ? r.employeeName : (idxEmp >= 0 ? String(r[idxEmp] ?? "").trim() : "");
      const chVal = currentView === "live" ? r.channel : (idxChannel >= 0 ? String(r[idxChannel] ?? "").trim() : "");
      const repVal = currentView === "live" ? r.reportingTo : (idxRep >= 0 ? String(r[idxRep] ?? "").trim() : "");

      const empOk = vEmp === "All" || empVal === vEmp;
      const chOk  = vChannel === "All" || chVal === vChannel;
      const repOk = vRep === "All" || repVal === vRep;
      const alphaOk = startsWithAlpha(empVal, selectedAlpha);

      return empOk && chOk && repOk && alphaOk;
    });
  }

  function applyFiltersForSlotBase(rows) {
    const vEmp = alEmp.value;
    const vRep = alRep.value;

    return rows.filter((r) => {
      const empVal = currentView === "live" ? r.employeeName : (idxEmp >= 0 ? String(r[idxEmp] ?? "").trim() : "");
      const repVal = currentView === "live" ? r.reportingTo : (idxRep >= 0 ? String(r[idxRep] ?? "").trim() : "");
      const empOk = vEmp === "All" || empVal === vEmp;
      const repOk = vRep === "All" || repVal === vRep;
      const alphaOk = startsWithAlpha(empVal, selectedAlpha);
      return empOk && repOk && alphaOk;
    });
  }

  function getBalanceEntitle(row) {
    if (currentView === "live") {
      const carry = toNumber(row.prevYearBalance);
      return round0(carry + 30);
    }
    const carry = idxPrevYearBalance >= 0 ? toNumber(row[idxPrevYearBalance]) : 0;
    return round0(carry + 30);
  }

  function countALBookedFullYear(row) {
    let c = 0;
    if (currentView === "live") {
      currentDateCols.forEach((dc) => {
        if (trim(row.cells[dateToISO(dc.dateObj)] ?? "") === "AL") c++;
      });
      return c;
    }
    for (const dc of dateCols) {
      const v = String(row[dc.idx] ?? "").trim();
      if (v === "AL") c++;
    }
    return c;
  }

  function countALUsedToYesterday(row) {
    let c = 0;
    if (currentView === "live") {
      currentDateCols.forEach((dc) => {
        if (dc.dateObj >= todayStart) return;
        if (trim(row.cells[dateToISO(dc.dateObj)] ?? "") === "AL") c++;
      });
      return c;
    }

    for (const dc of dateCols) {
      if (dc.dateObj >= todayStart) continue;
      const v = String(row[dc.idx] ?? "").trim();
      if (v === "AL") c++;
    }
    return c;
  }

  function calcRemaining(row) {
    const ent = getBalanceEntitle(row);
    const booked = countALBookedFullYear(row);
    return round0(ent - booked);
  }

  function countAL_JanToMar_CurrentYear(row) {
    let c = 0;

    if (currentView === "live") {
      currentDateCols.forEach((dc) => {
        if (dc.dateObj < jan1 || dc.dateObj > mar31) return;
        if (trim(row.cells[dateToISO(dc.dateObj)] ?? "") === "AL") c++;
      });
      return c;
    }

    for (const dc of dateCols) {
      if (dc.dateObj < jan1 || dc.dateObj > mar31) continue;
      const v = String(row[dc.idx] ?? "").trim();
      if (v === "AL") c++;
    }
    return c;
  }

  function calcPrevYearRemainingPolicy(row) {
    const prevBalance = currentView === "live"
      ? toNumber(row.prevYearBalance)
      : (idxPrevYearBalance >= 0 ? toNumber(row[idxPrevYearBalance]) : 0);

    const usedJanMar = countAL_JanToMar_CurrentYear(row);
    return Math.max(0, round0(prevBalance - usedJanMar));
  }

  function sumUPL(rowsFiltered) {
    if (currentView === "live") {
      let s = 0;
      rowsFiltered.forEach(r => { if (isActiveCurrentRow(r)) s += toNumber(r.upl); });
      return round0(s);
    }

    if (idxUPL >= 0) {
      let s = 0;
      rowsFiltered.forEach(r => { if (isActiveCsvRow(r)) s += toNumber(r[idxUPL]); });
      return round0(s);
    }

    let count = 0;
    rowsFiltered.forEach(r => {
      if (!isActiveCsvRow(r)) return;
      for (const dc of dateCols) {
        const v = String(r[dc.idx] ?? "").trim();
        if (v === "UL" || v === "UPL") count++;
      }
    });
    return round0(count);
  }

  function buildMainColgroup() {
    colgroup.innerHTML = "";
    const widths = [120, 270, 190, 130, 95, 110, 90, 90, 110];
    widths.forEach((w) => {
      const col = document.createElement("col");
      col.style.width = `${w}px`;
      colgroup.appendChild(col);
    });
    currentDateCols.forEach(() => {
      const col = document.createElement("col");
      col.style.width = "105px";
      colgroup.appendChild(col);
    });
  }

  function buildMainHeader() {
    thead.innerHTML = "";

    const tr1 = document.createElement("tr");
    tr1.className = "day-row";

    const tr2 = document.createElement("tr");
    tr2.className = "date-row";

    ["Employee ID","Employee Name","Job Title","Joining Date","Activation"].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      th.rowSpan = 2;
      tr1.appendChild(th);
    });

    ["Balance Entitle","AL Booked","AL Used","AL Remaining"].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      th.rowSpan = 2;
      tr1.appendChild(th);
    });

    currentDateCols.forEach(dc => {
      const thW = document.createElement("th");
      thW.textContent = dc.weekday;
      tr1.appendChild(thW);

      const thD = document.createElement("th");
      thD.textContent = dc.header;
      tr2.appendChild(thD);
    });

    thead.appendChild(tr1);
    thead.appendChild(tr2);
  }

  function renderMainBody(rowsFiltered) {
    tbody.innerHTML = "";

    if (!rowsFiltered.length) {
      tbody.innerHTML = `<tr><td colspan="999">No data</td></tr>`;
      requestAnimationFrame(syncBottomScrollbar);
      return;
    }

    rowsFiltered.forEach(r => {
      const tr = document.createElement("tr");

      const empId = currentView === "live" ? r.employeeId : (idxEmpId >= 0 ? String(r[idxEmpId] ?? "").trim() : "");
      const empName = currentView === "live" ? r.employeeName : (idxEmpName >= 0 ? String(r[idxEmpName] ?? "").trim() : "");
      const job = currentView === "live" ? r.jobTitle : (idxJob >= 0 ? String(r[idxJob] ?? "").trim() : "");
      const join = currentView === "live" ? r.joiningDate : (idxJoining >= 0 ? String(r[idxJoining] ?? "").trim() : "");
      const act = currentView === "live" ? r.activation : (idxActivation >= 0 ? String(r[idxActivation] ?? "").trim() : "");

      const ent = getBalanceEntitle(r);
      const booked = round0(countALBookedFullYear(r));
      const used = round0(countALUsedToYesterday(r));
      const remaining = calcRemaining(r);

      tr.innerHTML += `<td>${esc(empId)}</td>`;

      const nameTd = document.createElement("td");
      nameTd.innerHTML = esc(empName);
      if (act === "In-Active") nameTd.classList.add("al-inactive-name");
      tr.appendChild(nameTd);

      tr.innerHTML += `<td>${esc(job)}</td>`;
      tr.innerHTML += `<td>${esc(join)}</td>`;
      tr.innerHTML += `<td>${esc(act)}</td>`;
      tr.innerHTML += `<td>${esc(ent)}</td>`;
      tr.innerHTML += `<td>${esc(booked)}</td>`;
      tr.innerHTML += `<td>${esc(used)}</td>`;
      tr.innerHTML += `<td>${esc(remaining)}</td>`;

      currentDateCols.forEach(dc => {
        const td = document.createElement("td");
        let val = "";
        let isLiveCell = false;

        if (currentView === "live") {
          const iso = dateToISO(dc.dateObj);
          val = trim(r.cells[iso] ?? "");
          isLiveCell = !!r.liveFlags[iso];
        } else {
          val = trim(String(r[dc.idx] ?? ""));
        }

        td.innerHTML = esc(val);
        if (currentView === "live" && isLiveCell && val === "AL") {
          td.classList.add("al-cell-live");
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    requestAnimationFrame(syncBottomScrollbar);
  }

  function renderFooterDailyShrink(rowsFiltered) {
    tfoot.innerHTML = "";
    if (!currentDateCols.length) return;

    const activeRows = rowsFiltered.filter(r => isActiveCurrentRow(r));
    const totalActive = activeRows.length;

    function createLeadingCells(label) {
      const cells = [];
      for (let i = 0; i < 8; i++) cells.push("<td></td>");
      cells.push(`<td>${esc(label)}</td>`);
      return cells.join("");
    }

    const trCount = document.createElement("tr");
    trCount.innerHTML = createLeadingCells("Daily Count");

    currentDateCols.forEach(dc => {
      let c = 0;
      activeRows.forEach(r => {
        const v = currentView === "live"
          ? trim(r.cells[dateToISO(dc.dateObj)] ?? "")
          : trim(String(r[dc.idx] ?? ""));
        if (v === "AL") c++;
      });
      const td = document.createElement("td");
      td.textContent = String(round0(c));
      trCount.appendChild(td);
    });

    const trShrink = document.createElement("tr");
    trShrink.innerHTML = createLeadingCells("Shrinkage%");

    currentDateCols.forEach(dc => {
      let c = 0;
      activeRows.forEach(r => {
        const v = currentView === "live"
          ? trim(r.cells[dateToISO(dc.dateObj)] ?? "")
          : trim(String(r[dc.idx] ?? ""));
        if (v === "AL") c++;
      });
      const pct = totalActive > 0 ? Math.round((c / totalActive) * 100) : 0;
      const td = document.createElement("td");
      td.textContent = `${pct}%`;
      trShrink.appendChild(td);
    });

    tfoot.appendChild(trCount);
    tfoot.appendChild(trShrink);
  }

  function renderKPIs(rowsFiltered) {
    const activeRows = rowsFiltered.filter(r => isActiveCurrentRow(r));

    let sumCreditYTD = 0;
    if (idxALCreditYTD >= 0) activeRows.forEach(r => sumCreditYTD += currentView === "live" ? toNumber(r.alCreditYTD) : toNumber(r[idxALCreditYTD]));

    let sumCredit = 0;
    if (idxALCredit >= 0) activeRows.forEach(r => sumCredit += currentView === "live" ? toNumber(r.alCredit) : toNumber(r[idxALCredit]));

    let sumDebit = 0;
    if (idxALDebit >= 0) activeRows.forEach(r => sumDebit += currentView === "live" ? toNumber(r.alDebit) : toNumber(r[idxALDebit]));

    let sumPrevPolicy = 0;
    activeRows.forEach(r => { sumPrevPolicy += calcPrevYearRemainingPolicy(r); });

    const upl = sumUPL(rowsFiltered);

    kpiCreditYTD.textContent = String(round0(sumCreditYTD));
    kpiCredit.textContent = String(round0(sumCredit));
    kpiDebit.textContent = String(round0(sumDebit));
    kpiPrevYearDebit.textContent = String(round0(sumPrevPolicy));
    kpiUPL.textContent = String(round0(upl));
  }

  function syncBottomScrollbar() {
    const wrap = $("alDataViewport");
    const table = $("annualLeaveTable");
    const scroll = $("alBottomScroll");
    const inner = $("alBottomScrollInner");

    if (!wrap || !table || !scroll || !inner) return;

    inner.style.width = `${Math.max(table.scrollWidth, wrap.clientWidth)}px`;

    if (scroll.scrollLeft !== wrap.scrollLeft) {
      scroll.scrollLeft = wrap.scrollLeft;
    }
  }

  function bindScrollSync() {
    const wrap = $("alDataViewport");
    const bottom = $("alBottomScroll");
    if (!wrap || !bottom) return;

    let locking = false;

    wrap.addEventListener("scroll", () => {
      if (locking) return;
      locking = true;
      bottom.scrollLeft = wrap.scrollLeft;
      requestAnimationFrame(() => { locking = false; });
    });

    bottom.addEventListener("scroll", () => {
      if (locking) return;
      locking = true;
      wrap.scrollLeft = bottom.scrollLeft;
      requestAnimationFrame(() => { locking = false; });
    });
  }

  function fitAnnualPageToViewport() {
    const page = $("al-page");
    if (!page) return;

    const rect = page.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const bottomGap = 8;
    const available = Math.max(430, viewportHeight - rect.top - bottomGap);

    page.style.height = `${available}px`;
    page.style.minHeight = `${available}px`;
    page.style.maxHeight = `${available}px`;

    requestAnimationFrame(syncBottomScrollbar);
  }

  function initLayoutFixes() {
    fitAnnualPageToViewport();
    syncBottomScrollbar();

    const refreshSync = () => {
      requestAnimationFrame(() => {
        fitAnnualPageToViewport();
        syncBottomScrollbar();
      });
    };

    window.addEventListener("resize", refreshSync);
    window.addEventListener("load", refreshSync);

    if (tbody) {
      const observer1 = new MutationObserver(refreshSync);
      observer1.observe(tbody, { childList: true, subtree: true });
    }

    if (thead) {
      const observer2 = new MutationObserver(refreshSync);
      observer2.observe(thead, { childList: true, subtree: true });
    }
  }

  function exportVisibleMainTable() {
    const table = $("annualLeaveTable");
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll("tr");
    rows.forEach(r => {
      const cells = Array.from(r.querySelectorAll("th,td")).map(c => {
        const text = c.textContent ?? "";
        return `"${String(text).replaceAll('"','""')}"`;
      });
      csv.push(cells.join(","));
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AnnualLeave_${currentView === "live" ? "Live" : "CSV"}_Export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getALPeriodsFromRow(row) {
    const periods = [];
    let inPeriod = false;
    let startDc = null;
    let lastDc = null;
    let count = 0;

    for (const dc of currentDateCols) {
      const val = currentView === "live"
        ? trim(row.cells[dateToISO(dc.dateObj)] ?? "")
        : trim(String(row[dc.idx] ?? ""));

      if (val === "AL") {
        if (!inPeriod) {
          inPeriod = true;
          startDc = dc;
          lastDc = dc;
          count = 1;
        } else {
          lastDc = dc;
          count++;
        }
      } else {
        if (inPeriod) {
          periods.push({
            requested: "",
            start: startDc.header,
            end: lastDc.header,
            count: String(count)
          });
          inPeriod = false;
          startDc = null;
          lastDc = null;
          count = 0;
        }
      }
    }

    if (inPeriod) {
      periods.push({
        requested: "",
        start: startDc.header,
        end: lastDc.header,
        count: String(count)
      });
    }

    return periods;
  }

  function renderSummaryTable() {
    const filteredBase = applyFiltersBase(currentRows);
    const vName = mEmp.value;
    const vCh = mChannel.value;

    const rows = filteredBase.filter(r => {
      const nameVal = currentView === "live" ? r.employeeName : String(r[idxEmpName] ?? "").trim();
      const chVal = currentView === "live" ? r.channel : String(r[idxChannel] ?? "").trim();

      const nameOk = vName === "All" || nameVal === vName;
      const chOk = vCh === "All" || chVal === vCh;
      return nameOk && chOk;
    });

    const perRow = rows.map(r => ({ r, periods: getALPeriodsFromRow(r) }));
    const maxPeriods = perRow.reduce((m, x) => Math.max(m, x.periods.length), 0);

    summaryThead.innerHTML = "";

    const trTop = document.createElement("tr");
    trTop.className = "day-row";
    const trSub = document.createElement("tr");
    trSub.className = "date-row";

    ["Employee ID","Employee Name","Channel","Remaining Balance"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      th.rowSpan = 2;
      trTop.appendChild(th);
    });

    if (maxPeriods === 0) {
      const th = document.createElement("th");
      th.textContent = "Periods";
      th.rowSpan = 2;
      trTop.appendChild(th);

      summaryThead.appendChild(trTop);
      summaryThead.appendChild(trSub);

      summaryTbody.innerHTML = rows.length
        ? rows.map(r => {
            const empId = currentView === "live" ? r.employeeId : String(r[idxEmpId] ?? "").trim();
            const name = currentView === "live" ? r.employeeName : String(r[idxEmpName] ?? "").trim();
            const ch = currentView === "live" ? r.channel : String(r[idxChannel] ?? "").trim();
            const remaining = calcRemaining(r);
            return `<tr>
              <td>${esc(empId)}</td>
              <td>${esc(name)}</td>
              <td>${esc(ch)}</td>
              <td>${esc(remaining)}</td>
              <td>No AL periods found in date columns</td>
            </tr>`;
          }).join("")
        : `<tr><td colspan="5">No data</td></tr>`;
      return;
    }

    for (let p = 1; p <= maxPeriods; p++) {
      const th = document.createElement("th");
      th.colSpan = 4;
      th.textContent = `Period ${p}`;
      if (p < maxPeriods) th.classList.add("summary-period-sep");
      trTop.appendChild(th);

      ["Requested Date","Start Date","End Date","Counts"].forEach((x, idx) => {
        const th2 = document.createElement("th");
        th2.textContent = x;
        if (idx === 3 && p < maxPeriods) th2.classList.add("summary-period-sep");
        trSub.appendChild(th2);
      });
    }

    summaryThead.appendChild(trTop);
    summaryThead.appendChild(trSub);

    if (!rows.length) {
      summaryTbody.innerHTML = `<tr><td colspan="${4 + maxPeriods * 4}">No data</td></tr>`;
      return;
    }

    summaryTbody.innerHTML = perRow.map(({ r, periods }) => {
      const empId = currentView === "live" ? r.employeeId : String(r[idxEmpId] ?? "").trim();
      const name = currentView === "live" ? r.employeeName : String(r[idxEmpName] ?? "").trim();
      const ch = currentView === "live" ? r.channel : String(r[idxChannel] ?? "").trim();
      const remaining = calcRemaining(r);

      const cells = [];
      cells.push(`<td>${esc(empId)}</td>`);
      cells.push(`<td>${esc(name)}</td>`);
      cells.push(`<td>${esc(ch)}</td>`);
      cells.push(`<td>${esc(remaining)}</td>`);

      for (let i = 0; i < maxPeriods; i++) {
        const p = periods[i];
        const sepClass = i < maxPeriods - 1 ? " summary-period-sep" : "";
        if (p) {
          cells.push(`<td>${esc(p.requested)}</td>`);
          cells.push(`<td>${esc(p.start)}</td>`);
          cells.push(`<td>${esc(p.end)}</td>`);
          cells.push(`<td class="${sepClass.trim()}">${esc(p.count)}</td>`);
        } else {
          cells.push(`<td></td><td></td><td></td><td class="${sepClass.trim()}"></td>`);
        }
      }

      return `<tr>${cells.join("")}</tr>`;
    }).join("");
  }

  function classifySlotSection(jobTitle) {
    const j = norm(jobTitle);
    if (j.includes("technical support agent") || j.includes(" - technical")) return "Technical";
    if (j.includes("inbound agent") || j.includes(" - voice")) return "Voice";
    if (j.includes("video call agent") || j.includes("video call") || j.includes(" - kiosk")) return "Kiosk";
    if (j.includes("email&chat agent") || j.includes("email/chat") || j.includes("email chat")) return "Email/Chat";
    if (j.includes("vip voice agent") || j.includes("vip voice") || j.includes(" - vip")) return "VIP";
    return "";
  }

  function getSlotRowsForFilter() {
    const baseRows = applyFiltersForSlotBase(currentRows);

    return baseRows.filter((r) => {
      if (!isActiveCurrentRow(r)) return false;
      const job = currentView === "live" ? r.jobTitle : (idxJob >= 0 ? String(r[idxJob] ?? "").trim() : "");
      const section = classifySlotSection(job);
      if (!section) return false;
      return slotActiveFilter === "All" ? true : section === slotActiveFilter;
    });
  }

  function buildSlotMatrix(rows) {
    const matrix = Array.from({ length: 12 }, () => Array(31).fill(0));

    rows.forEach((r) => {
      currentDateCols.forEach((dc) => {
        const v = currentView === "live"
          ? trim(r.cells[dateToISO(dc.dateObj)] ?? "")
          : trim(String(r[dc.idx] ?? ""));
        if (v === "AL") {
          const m = dc.monthIndex;
          const d = dc.dayOfMonth - 1;
          if (m >= 0 && m < 12 && d >= 0 && d < 31) matrix[m][d] += 1;
        }
      });
    });

    return matrix;
  }

  function renderSlotStatusTable() {
    const rows = getSlotRowsForFilter();
    const matrix = buildSlotMatrix(rows);

    slotInfo.textContent =
      slotActiveFilter === "All"
        ? "Showing all sections."
        : `Showing section: ${slotActiveFilter}`;

    slotThead.innerHTML = "";
    slotTbody.innerHTML = "";

    const tr = document.createElement("tr");
    const th0 = document.createElement("th");
    th0.textContent = "Day";
    tr.appendChild(th0);

    for (let day = 1; day <= 31; day++) {
      const th = document.createElement("th");
      th.textContent = String(day);
      tr.appendChild(th);
    }
    slotThead.appendChild(tr);

    for (let month = 0; month < 12; month++) {
      const rowEl = document.createElement("tr");

      const tdMonth = document.createElement("td");
      tdMonth.textContent = monthShortName(month);
      rowEl.appendChild(tdMonth);

      for (let day = 0; day < 31; day++) {
        const td = document.createElement("td");
        const count = matrix[month][day];
        td.textContent = String(count);

        if (slotActiveFilter === "Voice") {
          td.classList.add("slot-cell-voice");
        } else {
          td.classList.add(count > 0 ? "slot-cell-positive" : "slot-cell-zero");
        }

        rowEl.appendChild(td);
      }

      slotTbody.appendChild(rowEl);
    }
  }

  function getSectionRowsForPlanning() {
    const rows = applyFiltersForSlotBase(currentRows).filter(r => isActiveCurrentRow(r));
    if (slotActiveFilter === "All") return rows;

    return rows.filter(r => {
      const job = currentView === "live" ? r.jobTitle : (idxJob >= 0 ? String(r[idxJob] ?? "").trim() : "");
      return classifySlotSection(job) === slotActiveFilter;
    });
  }

  function getLanguageLabel(raw) {
    const v = String(raw ?? "").trim();
    return v || "Unspecified";
  }

  function countMonthlyALByLanguage(rows, languageLabel) {
    const monthly = { Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0, Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0 };

    rows.forEach(r => {
      const rawLang = currentView === "live"
        ? r.spokenLanguages
        : (idxSpokenLanguages >= 0 ? r[idxSpokenLanguages] : "");

      const lang = getLanguageLabel(rawLang);
      if (lang !== languageLabel) return;

      currentDateCols.forEach(dc => {
        const v = currentView === "live"
          ? trim(r.cells[dateToISO(dc.dateObj)] ?? "")
          : trim(String(r[dc.idx] ?? ""));
        if (v === "AL") {
          monthly[monthShortName(dc.dateObj.getMonth())] += 1;
        }
      });
    });

    return monthly;
  }

  function fmtPct(n) {
    return `${(Number(n) || 0).toFixed(2)}%`;
  }

  function fmt1(n) {
    return (Math.round((Number(n) || 0) * 10) / 10).toFixed(1);
  }

  function buildPlanRow(label, values, extraClass = "") {
    const cells = values.map(v => `<td>${esc(v)}</td>`).join("");
    return `<tr class="${extraClass}"><td>${esc(label)}</td>${cells}</tr>`;
  }

  function buildVarianceRow(label, values) {
    const cells = values.map(v => {
      const cls = v < 0 ? "slot-var-good" : v > 0 ? "slot-var-bad" : "slot-var-neutral";
      return `<td class="${cls}">${esc(fmt1(v))}</td>`;
    }).join("");
    return `<tr class="slot-plan-variance"><td>${esc(label)}</td>${cells}</tr>`;
  }

  function renderSlotPlanTable() {
    const sectionRows = getSectionRowsForPlanning();
    const sectionLabel = slotActiveFilter === "All" ? "All Sections" : slotActiveFilter;

    slotPlanTitle.textContent = `${sectionLabel} AL Planning`;
    slotPlanThead.innerHTML = "";
    slotPlanTbody.innerHTML = "";

    const htr = document.createElement("tr");
    const lead = document.createElement("th");
    lead.textContent = sectionLabel;
    htr.appendChild(lead);

    MONTH_KEYS.forEach(m => {
      const th = document.createElement("th");
      th.textContent = m;
      th.className = "slot-plan-month";
      htr.appendChild(th);
    });
    slotPlanThead.appendChild(htr);

    if (!sectionRows.length) {
      slotPlanTbody.innerHTML = `<tr><td colspan="13">No data</td></tr>`;
      return;
    }

    const sectionHC = sectionRows.length;

    let languages = uniqueSorted(
      sectionRows.map(r => getLanguageLabel(currentView === "live"
        ? r.spokenLanguages
        : (idxSpokenLanguages >= 0 ? r[idxSpokenLanguages] : "")))
    );
    if (!languages.length) languages = ["Unspecified"];

    const subgroupHC = {};
    languages.forEach(lang => {
      subgroupHC[lang] = sectionRows.filter(
        r => getLanguageLabel(currentView === "live"
          ? r.spokenLanguages
          : (idxSpokenLanguages >= 0 ? r[idxSpokenLanguages] : "")) === lang
      ).length;
    });

    const pctCfg = SLOT_PLAN_PCT[slotActiveFilter] || SLOT_PLAN_PCT.All || {};
    const rowsHtml = [];

    rowsHtml.push(buildPlanRow(`${sectionLabel} - HC`, MONTH_KEYS.map(() => String(sectionHC)), "slot-plan-label-soft"));

    languages.forEach(lang => {
      rowsHtml.push(buildPlanRow(`HC ${lang}`, MONTH_KEYS.map(() => String(subgroupHC[lang] || 0)), "slot-plan-label-soft"));
    });

    rowsHtml.push(buildPlanRow("Planned Annual Leave%", MONTH_KEYS.map(m => fmtPct(pctCfg[m] ?? 0)), ""));

    const actualGroupTotals = {};
    languages.forEach(lang => {
      const vals = MONTH_KEYS.map(m => {
        const hc = subgroupHC[lang] || 0;
        const days = MONTH_DAYS[m];
        const val = days > 0 ? ((hc * 30) / 12) / days : 0;
        return String(round0(val));
      });
      rowsHtml.push(buildPlanRow(`Planned Annual leave for ${lang}`, vals, ""));
      actualGroupTotals[lang] = countMonthlyALByLanguage(sectionRows, lang);
    });

    const totalValuesNumeric = MONTH_KEYS.map(m => sectionHC * ((pctCfg[m] ?? 0) / 100));
    rowsHtml.push(buildPlanRow("Total", totalValuesNumeric.map(fmt1), "slot-plan-total"));

    languages.forEach(lang => {
      const vals = MONTH_KEYS.map(m => fmt1((actualGroupTotals[lang]?.[m] || 0) / 30));
      rowsHtml.push(buildPlanRow(`Actual Leave ${lang}`, vals, ""));
    });

    const varianceVals = MONTH_KEYS.map((m, idx) => {
      let sumActual = 0;
      languages.forEach(lang => {
        sumActual += (actualGroupTotals[lang]?.[m] || 0) / 30;
      });
      return round1(sumActual - totalValuesNumeric[idx]);
    });

    rowsHtml.push(buildVarianceRow("Variance", varianceVals));
    slotPlanTbody.innerHTML = rowsHtml.join("");
  }

  function setActiveSlotButton() {
    slotButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.slot === slotActiveFilter);
    });
  }

  function openSummaryModal() {
    modalBackdrop.style.display = "flex";

    const filtered = applyFiltersBase(currentRows);
    const names = uniqueSorted(filtered.map(r => currentView === "live" ? r.employeeName : r[idxEmpName]));
    const chans = uniqueSorted(filtered.map(r => currentView === "live" ? r.channel : r[idxChannel]));

    setOptions(mEmp, names);
    setOptions(mChannel, chans);

    renderSummaryTable();
  }

  function closeSummaryModal() {
    modalBackdrop.style.display = "none";
  }

  function openSlotModal() {
    slotModalBackdrop.style.display = "flex";
    setActiveSlotButton();
    renderSlotStatusTable();
    renderSlotPlanTable();
  }

  function closeSlotModal() {
    slotModalBackdrop.style.display = "none";
  }

  function enableUI() {
    [alEmp, alChannel, alRep].forEach(s => s.disabled = false);
    [btnRefresh, btnViewSummary, btnSlotStatus, btnExport, btnCsvView, btnLiveView].forEach(b => b.disabled = false);
  }

  function buildLiveRows() {
    return applyLiveAnnualRequests(allRows).then((liveData) => {
      currentRows = liveData.map((x) => ({
        rowKey: x.rowKey,
        baseRow: x.baseRow,
        cells: x.cells,
        liveFlags: x.liveFlags,
        employeeId: idxEmpId >= 0 ? trim(x.baseRow[idxEmpId]) : "",
        employeeName: idxEmpName >= 0 ? trim(x.baseRow[idxEmpName]) : "",
        jobTitle: idxJob >= 0 ? trim(x.baseRow[idxJob]) : "",
        joiningDate: idxJoining >= 0 ? trim(x.baseRow[idxJoining]) : "",
        activation: idxActivation >= 0 ? trim(x.baseRow[idxActivation]) : "",
        channel: idxChannel >= 0 ? trim(x.baseRow[idxChannel]) : "",
        reportingTo: idxRep >= 0 ? trim(x.baseRow[idxRep]) : "",
        spokenLanguages: idxSpokenLanguages >= 0 ? trim(x.baseRow[idxSpokenLanguages]) : "",
        alCreditYTD: idxALCreditYTD >= 0 ? trim(x.baseRow[idxALCreditYTD]) : "",
        alCredit: idxALCredit >= 0 ? trim(x.baseRow[idxALCredit]) : "",
        alDebit: idxALDebit >= 0 ? trim(x.baseRow[idxALDebit]) : "",
        upl: idxUPL >= 0 ? trim(x.baseRow[idxUPL]) : "",
        prevYearBalance: idxPrevYearBalance >= 0 ? trim(x.baseRow[idxPrevYearBalance]) : ""
      }));
      currentDateCols = [...dateCols];
    });
  }

  function buildCsvRows() {
    currentRows = [...allRows];
    currentDateCols = [...dateCols];
  }

  function refreshRender() {
    const filtered = applyFiltersBase(currentRows);
    buildMainColgroup();
    buildMainHeader();
    renderMainBody(filtered);
    renderFooterDailyShrink(filtered);
    renderKPIs(filtered);
    requestAnimationFrame(syncBottomScrollbar);
  }

  function activateView(viewName) {
    currentView = viewName;

    btnCsvView.classList.toggle("active", viewName === "csv");
    btnLiveView.classList.toggle("active", viewName === "live");

    if (viewName === "live") {
      setStatus("Loading Annual Leave live requests...");
      buildLiveRows()
        .then(() => {
          buildFilterValues();
          refreshRender();
          setStatus("Annual Leave Live view loaded ✅");
        })
        .catch((e) => {
          console.error("Live annual load error:", e);
          setStatus(`Live load failed, showing CSV only: ${e.message}`);
          currentView = "csv";
          btnCsvView.classList.add("active");
          btnLiveView.classList.remove("active");
          buildCsvRows();
          buildFilterValues();
          refreshRender();
        });
      return;
    }

    buildCsvRows();
    buildFilterValues();
    refreshRender();
    setStatus("Annual Leave CSV view loaded ✅");
  }

  function resetFilters() {
    alEmp.value = "All";
    alChannel.value = "All";
    alRep.value = "All";
    selectedAlpha = "ALL";

    alphaBar.querySelectorAll("button[data-alpha]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-alpha") === "ALL");
    });

    refreshRender();
  }

  function initAlphabetBar() {
    if (!alphaBar) return;
    alphaBar.querySelectorAll("button[data-alpha]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedAlpha = btn.getAttribute("data-alpha") || "ALL";
        alphaBar.querySelectorAll("button").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        refreshRender();
      });
    });
  }

  try {
    setStatus("Loading annual.csv ...");
    await loadCsvData();

    enableUI();
    bindScrollSync();
    initAlphabetBar();
    initLayoutFixes();

    btnCsvView.addEventListener("click", () => activateView("csv"));
    btnLiveView.addEventListener("click", () => activateView("live"));

    [alEmp, alChannel, alRep].forEach(sel => sel.addEventListener("change", () => {
      refreshRender();
      if (slotModalBackdrop.style.display === "flex") {
        renderSlotStatusTable();
        renderSlotPlanTable();
      }
    }));

    btnRefresh.addEventListener("click", resetFilters);
    btnViewSummary.addEventListener("click", openSummaryModal);
    btnSlotStatus.addEventListener("click", openSlotModal);
    btnExport.addEventListener("click", exportVisibleMainTable);

    modalClose.addEventListener("click", closeSummaryModal);
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target && e.target.id === "alModalBackdrop") closeSummaryModal();
    });

    if (mEmp) mEmp.addEventListener("change", renderSummaryTable);
    if (mChannel) mChannel.addEventListener("change", renderSummaryTable);

    slotModalClose.addEventListener("click", closeSlotModal);
    slotModalBackdrop.addEventListener("click", (e) => {
      if (e.target && e.target.id === "slotModalBackdrop") closeSlotModal();
    });

    slotButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        slotActiveFilter = btn.dataset.slot || "All";
        setActiveSlotButton();
        renderSlotStatusTable();
        renderSlotPlanTable();
      });
    });

    btnSlotSendEmail.addEventListener("click", () => {
      alert("Send Email from Slot Status: will be implemented later.");
    });

    activateView("live");
  } catch (e) {
    console.error("Annual load/render error:", e);
    setStatus(`Failed to load annual.csv ❌ ${e.message}`);
    thead.innerHTML = `<tr><th>Error</th></tr>`;
    tbody.innerHTML = `<tr><td>${esc(e.message)}</td></tr>`;
  }
});
