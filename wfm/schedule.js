document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const CSV_URL = "./schedule.csv";
  const FETCH_FLOW_URL =
    "https://defaultbcb663ac7e41496bb17757c08849b2.30.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0f89554ef20848b284ab357e7df733a8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UXSqcLX4jvzH2jpxos-Fr8L0ZeRtmfhjW5vIW3KliCk";

  const STATUS_COMPLETED = "Completed";

  const $ = (id) => document.getElementById(id);

  const headRow = $("scheduleHead");
  const tbody = $("scheduleBody");
  const tableWrap = $("tableWrap");
  const scheduleTable = $("scheduleTable");
  const bottomScroll = $("bottomScroll");
  const bottomScrollInner = $("bottomScrollInner");

  const btnCsvView = $("btnCsvView");
  const btnLiveView = $("btnLiveView");
  const banner = $("scheduleBanner");

  const countWeeklyReq = $("countWeeklyReq");
  const countChangeReq = $("countChangeReq");
  const countSwapReq = $("countSwapReq");

  const btnHideColumns = $("btnHideColumns");
  const btnViewSummary = $("btnViewSummary");
  const btnRefreshTable = $("btnRefreshTable");

  const alphaWrap = $("alphaWrap");

  const dateBtn = $("dateRangeBtn");
  const pop = $("datePopover");
  const dpStart = $("dpStart");
  const dpEnd = $("dpEnd");
  const dpApply = $("dpApply");
  const dpCancel = $("dpCancel");
  const wkTitle = $("wkTitle");
  const wkPrev = $("wkPrev");
  const wkNext = $("wkNext");

  const filterPopover = $("msFilterPopover");
  const filterTitle = $("msFilterTitle");
  const filterClose = $("msFilterClose");
  const filterSearch = $("msFilterSearch");
  const filterSelectAll = $("msFilterSelectAll");
  const filterClear = $("msFilterClear");
  const filterList = $("msFilterList");
  const filterResetCol = $("msFilterResetCol");
  const filterApply = $("msFilterApply");

  const hideColsModal = $("hideColsModal");
  const hideColsList = $("hideColsList");
  const hideColsClose = $("hideColsClose");
  const hideColsCancel = $("hideColsCancel");
  const hideColsApply = $("hideColsApply");

  const summaryModal = $("summaryModal");
  const summaryWrap = $("summaryWrap");
  const summarySub = $("summarySub");
  const summaryClose = $("summaryClose");
  const summaryClose2 = $("summaryClose2");

  if (
    !headRow || !tbody || !tableWrap || !scheduleTable || !bottomScroll || !bottomScrollInner ||
    !btnCsvView || !btnLiveView || !banner ||
    !countWeeklyReq || !countChangeReq || !countSwapReq ||
    !btnHideColumns || !btnViewSummary || !btnRefreshTable ||
    !alphaWrap ||
    !dateBtn || !pop || !dpStart || !dpEnd || !dpApply || !dpCancel || !wkTitle || !wkPrev || !wkNext ||
    !filterPopover || !filterTitle || !filterClose || !filterSearch || !filterSelectAll || !filterClear || !filterList || !filterResetCol || !filterApply ||
    !hideColsModal || !hideColsList || !hideColsClose || !hideColsCancel || !hideColsApply ||
    !summaryModal || !summaryWrap || !summarySub || !summaryClose || !summaryClose2
  ) {
    console.error("Master Schedule: Missing required elements.");
    return;
  }

  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */
  const esc = (v) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const trim = (v) => String(v ?? "").trim();
  const norm = (v) => trim(v).toLowerCase();

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
        if (row.some((c) => trim(c) !== "")) rows.push(row);
        row = [];
      } else {
        cur += ch;
      }
    }

    if (cur.length || row.length) {
      row.push(cur);
      if (row.some((c) => trim(c) !== "")) rows.push(row);
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

  function buildHeaderIndex(headers) {
    const idx = {};
    headers.forEach((h, i) => {
      idx[norm(String(h ?? "").replace("\ufeff", ""))] = i;
    });
    return idx;
  }

  function findColIndex(headerIndex, aliasList) {
    for (const alias of aliasList) {
      const key = norm(alias);
      if (key in headerIndex) return headerIndex[key];
    }

    const keys = Object.keys(headerIndex);
    for (const alias of aliasList) {
      const key = norm(alias);
      const match = keys.find((k) => k.includes(key));
      if (match) return headerIndex[match];
    }
    return -1;
  }

  function parseScheduleDateHeader(h) {
    const m = trim(h).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const dt = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    dt.setHours(0, 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function formatDateKey(dateObj) {
    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
  }

  function toInputDateValue(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function fromInputDateValue(v) {
    if (!v) return null;
    const d = new Date(v);
    d.setHours(0, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatTitleDate(dateObj) {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function setBanner(msg, kind = "info") {
    banner.textContent = msg || "";
    banner.dataset.kind = kind;
  }

  function normalizeStoredStatus(status) {
    const s = norm(status);

    if (!s) return "";
    if (s.includes("completed")) return "Completed";
    if (s.includes("rejected by supervisor")) return "Rejected by Supervisor";
    if (s.includes("rejected by wfm")) return "Rejected by WFM";
    if (s.includes("pending wfm")) return "Pending WFM";
    if (s.includes("pending supervisor")) return "Pending Supervisor";
    if (s.includes("approved")) return "Completed";
    return trim(status);
  }

  function getLatestTimestamp(req) {
    const p = req.payload || {};
    return (
      p.wfmDecisionAt ||
      p.lastUpdatedAt ||
      p.supervisorDecisionAt ||
      req.modified ||
      req.created ||
      p.createdAt ||
      ""
    );
  }

  function uniqueSorted(arr) {
    return Array.from(new Set(arr.map((x) => trim(x))))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  function matchesAlpha(name, selected) {
    if (selected === "All") return true;
    return norm(name).startsWith(norm(selected));
  }

  function isDateWithinRange(dateKey, startDate, endDate) {
    const d = parseScheduleDateHeader(dateKey);
    if (!d) return false;
    if (!startDate || !endDate) return true;
    return d >= startDate && d <= endDate;
  }

  function getRangeSpanDays() {
    if (!selectedStartDate || !selectedEndDate) return 0;
    const diff = selectedEndDate.getTime() - selectedStartDate.getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }

  function closeDatePopover() {
    pop.hidden = true;
  }

  function updateDateTitleAndInputs() {
    if (!selectedStartDate || !selectedEndDate) {
      wkTitle.textContent = "";
      return;
    }
    wkTitle.textContent = `${formatTitleDate(selectedStartDate)} - ${formatTitleDate(selectedEndDate)}`;
    dpStart.value = toInputDateValue(selectedStartDate);
    dpEnd.value = toInputDateValue(selectedEndDate);
  }

  function setDateRange(start, end) {
    if (!start || !end) return;
    const s = new Date(start);
    const e = new Date(end);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    selectedStartDate = s <= e ? s : e;
    selectedEndDate = s <= e ? e : s;

    updateDateTitleAndInputs();
    renderCurrentView();
  }

  function buildDefaultRangeForView(viewName) {
    const allDateHeaders = viewName === "live" ? liveAllDateHeaders : csvAllDateHeaders;
    if (!allDateHeaders.length) return null;

    const dates = allDateHeaders
      .map(parseScheduleDateHeader)
      .filter(Boolean)
      .sort((a, b) => a - b);

    return {
      start: dates[0],
      end: dates[dates.length - 1]
    };
  }

  function applyDefaultRangeForCurrentView() {
    const d = buildDefaultRangeForView(currentView);
    if (!d) return;
    selectedStartDate = d.start;
    selectedEndDate = d.end;
    updateDateTitleAndInputs();
  }

  function syncBottomScrollWidth() {
    requestAnimationFrame(() => {
      bottomScrollInner.style.width = `${scheduleTable.scrollWidth}px`;
    });
  }

  function openModal(el) {
    el.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal(el) {
    el.hidden = true;
    document.body.style.overflow = "";
  }

  /* -------------------------------------------------------
     Column model
  ------------------------------------------------------- */
  const staticColumns = [
    { key: "genesysId", label: "Genesys ID", aliases: ["genesys id", "genesys", "genesysid"], hideable: true },
    { key: "employeeId", label: "Employee ID", aliases: ["employee id", "employeeid"], hideable: true },
    { key: "email", label: "Email", aliases: ["email"], hideable: true },
    { key: "tazeez", label: "Tazeez", aliases: ["tazeez"], hideable: true },
    { key: "agentName", label: "Agent Name", aliases: ["agent name", "employee name", "agent"], hideable: false },
    { key: "channel", label: "Channel", aliases: ["channel"], hideable: true },
    { key: "jobTitleLine", label: "Job Title - Line", aliases: ["job title - line"], hideable: true },
    { key: "jobTitle", label: "Job Title", aliases: ["job title", "job"], hideable: true },
    { key: "reportingTo", label: "Reporting to", aliases: ["reporting to", "reportingto", "reporting"], hideable: true },
    { key: "supervisor", label: "Supervisor", aliases: ["supervisor"], hideable: true },
    { key: "mainLanguage", label: "Main Language", aliases: ["main language", "language", "lang"], hideable: true }
  ];

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */
  let currentView = "live";
  let selectedAlpha = "All";

  let csvAllDateHeaders = [];
  let liveAllDateHeaders = [];

  let selectedStartDate = null;
  let selectedEndDate = null;

  let csvRows = [];
  let csvRowByKey = new Map();

  let liveRows = [];

  let hiddenStaticColumns = new Set();
  let headerFilterState = {};

  let activeFilterColumn = null;
  let activeFilterDraft = new Set();
  let activeFilterAnchor = null;

  let hideColumnDraft = new Set();

  /* -------------------------------------------------------
     CSV Load
  ------------------------------------------------------- */
  async function loadCsvData() {
    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);

    const text = await res.text();
    const grid = parseCSV(text);
    if (grid.length < 2) throw new Error("CSV has no data rows.");

    const headers = grid[0].map((h) => trim(String(h).replace("\ufeff", "")));
    const headerIndex = buildHeaderIndex(headers);
    const dataRows = grid.slice(1);

    const staticIndexes = {};
    staticColumns.forEach((col) => {
      staticIndexes[col.key] = findColIndex(headerIndex, col.aliases);
    });

    csvAllDateHeaders = headers.filter((h) => parseScheduleDateHeader(h));

    csvRows = dataRows.map((row, idx) => {
      const staticData = {};
      staticColumns.forEach((col) => {
        const i = staticIndexes[col.key];
        staticData[col.key] = i >= 0 ? trim(row[i]) : "";
      });

      const dates = {};
      csvAllDateHeaders.forEach((dh) => {
        const i = headers.indexOf(dh);
        dates[dh] = i >= 0 ? trim(row[i]) : "";
      });

      const rowKey =
        trim(staticData.genesysId) ||
        `name:${norm(staticData.agentName)}` ||
        `row:${idx}`;

      return {
        rowKey,
        static: staticData,
        dates
      };
    });

    csvRowByKey = new Map(csvRows.map((r) => [r.rowKey, r]));
  }

  function findCsvRowKey(genesysId, employeeName) {
    const g = trim(genesysId);
    if (g) {
      const hit = csvRows.find((r) => trim(r.static.genesysId) === g);
      if (hit) return hit.rowKey;
    }

    const n = norm(employeeName);
    if (n) {
      const hit = csvRows.find((r) => norm(r.static.agentName) === n);
      if (hit) return hit.rowKey;
    }

    return "";
  }

  function getCsvExactValue(rowKey, dateKey) {
    const row = csvRowByKey.get(rowKey);
    if (!row) return "";
    return trim(row.dates[dateKey] ?? "");
  }

  function getPreviousWeekSameDayValue(rowKey, dateKey) {
    const row = csvRowByKey.get(rowKey);
    if (!row) return "";

    const dt = parseScheduleDateHeader(dateKey);
    if (!dt) return "";

    const prev = new Date(dt);
    prev.setDate(prev.getDate() - 7);
    prev.setHours(0, 0, 0, 0);

    const prevKey = formatDateKey(prev);
    return trim(row.dates?.[prevKey] ?? "");
  }

  /* -------------------------------------------------------
     Live Load
  ------------------------------------------------------- */
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

  function setLiveCell(updateMap, employeeKey, dateKey, incoming) {
    const composite = `${employeeKey}||${dateKey}`;
    const existing = updateMap.get(composite);

    if (!existing) {
      updateMap.set(composite, incoming);
      return;
    }

    const oldTs = new Date(existing.latestAt || 0).getTime();
    const newTs = new Date(incoming.latestAt || 0).getTime();

    if (newTs >= oldTs) {
      updateMap.set(composite, incoming);
    }
  }

  function processWeeklyRequest(req, updateMap) {
    const p = req.payload || {};
    const payload = p.payload || p;
    const headers = Array.isArray(payload.headers) ? payload.headers : [];
    const rows = Array.isArray(payload.rows) ? payload.rows : [];

    if (!headers.length || !rows.length) return;

    const idxEmpName = headers.findIndex((h) => norm(h) === "employee name");
    const idxGenesys = headers.findIndex((h) => norm(h) === "genesys id");
    const dateCols = headers
      .map((h, i) => ({ header: trim(h), index: i }))
      .filter((x) => parseScheduleDateHeader(x.header));

    const requestId = trim(req.id || req.rawId || req.requestId || "");
    const latestAt = getLatestTimestamp(req);

    rows.forEach((row) => {
      const employeeName = idxEmpName >= 0 ? trim(row[idxEmpName]) : "";
      const genesysId = idxGenesys >= 0 ? trim(row[idxGenesys]) : "";
      const rowKey = findCsvRowKey(genesysId, employeeName);
      if (!rowKey) return;

      dateCols.forEach((dc) => {
        const val = trim(row[dc.index]);
        if (!val) return;

        const prevWeekValue = getPreviousWeekSameDayValue(rowKey, dc.header);
        const changed = val !== prevWeekValue;

        setLiveCell(updateMap, rowKey, dc.header, {
          value: val,
          sourceType: "Weekly",
          requestId,
          latestAt,
          changed
        });
      });
    });
  }

  function processShiftChangeRequest(req, updateMap) {
    const p = req.payload || {};
    const payload = p.payload || p;
    const employees = Array.isArray(payload.employees) ? payload.employees : [];

    const requestId = trim(req.id || req.rawId || req.requestId || "");
    const latestAt = getLatestTimestamp(req);

    employees.forEach((emp) => {
      const rowKey = findCsvRowKey(emp.genesysId, emp.employeeName);
      if (!rowKey) return;

      const changes = Array.isArray(emp.changes) ? emp.changes : [];
      changes.forEach((ch) => {
        const dateKey = trim(ch.date);
        const value = trim(ch.requestedValue);
        if (!dateKey || !value || !parseScheduleDateHeader(dateKey)) return;

        const baseValue = getCsvExactValue(rowKey, dateKey);
        const changed = value !== baseValue;

        setLiveCell(updateMap, rowKey, dateKey, {
          value,
          sourceType: "Change",
          requestId,
          latestAt,
          changed
        });
      });
    });
  }

  function processShiftSwapRequest(req, updateMap) {
    const p = req.payload || {};
    const payload = p.payload || p;
    const pairs = Array.isArray(payload.pairs) ? payload.pairs : [];

    const requestId = trim(req.id || req.rawId || req.requestId || "");
    const latestAt = getLatestTimestamp(req);

    pairs.forEach((pair) => {
      const primary = pair.primary || {};
      const secondary = pair.secondary || {};
      const primaryKey = findCsvRowKey(primary.genesysId, primary.employeeName);
      const secondaryKey = findCsvRowKey(secondary.genesysId, secondary.employeeName);

      if (!primaryKey || !secondaryKey) return;

      const swaps = Array.isArray(pair.swaps) ? pair.swaps : [];
      swaps.forEach((sw) => {
        const dateKey = trim(sw.date);
        if (!dateKey || !parseScheduleDateHeader(dateKey)) return;

        const primaryNew = trim(sw.secondaryValue);
        const secondaryNew = trim(sw.primaryValue);

        if (primaryNew) {
          const baseValue = getCsvExactValue(primaryKey, dateKey);
          const changed = primaryNew !== baseValue;

          setLiveCell(updateMap, primaryKey, dateKey, {
            value: primaryNew,
            sourceType: "Swap",
            requestId,
            latestAt,
            changed
          });
        }

        if (secondaryNew) {
          const baseValue = getCsvExactValue(secondaryKey, dateKey);
          const changed = secondaryNew !== baseValue;

          setLiveCell(updateMap, secondaryKey, dateKey, {
            value: secondaryNew,
            sourceType: "Swap",
            requestId,
            latestAt,
            changed
          });
        }
      });
    });
  }

  async function buildLiveData() {
    const allRequests = await fetchRequests();
    const completed = allRequests.filter((r) => r.normalizedStatus === STATUS_COMPLETED);

    const relevant = completed.filter((r) => {
      const type = norm(r.requestType || r.payload?.type || r.payload?.payload?.type || "");
      return [
        "weekly roster submission",
        "shift change request",
        "shift swap request"
      ].includes(type);
    });

    const updateMap = new Map();

    relevant.forEach((req) => {
      const type = norm(req.requestType || req.payload?.type || req.payload?.payload?.type || "");

      if (type === "weekly roster submission") processWeeklyRequest(req, updateMap);
      if (type === "shift change request") processShiftChangeRequest(req, updateMap);
      if (type === "shift swap request") processShiftSwapRequest(req, updateMap);
    });

    const allDateSet = new Set();
    updateMap.forEach((val, composite) => {
      const dateKey = composite.split("||")[1];
      if (dateKey) allDateSet.add(dateKey);
    });

    liveAllDateHeaders = Array.from(allDateSet).sort((a, b) => {
      const da = parseScheduleDateHeader(a);
      const db = parseScheduleDateHeader(b);
      return da - db;
    });

    liveRows = csvRows
      .map((csvRow) => {
        const cellMap = {};
        let hasAny = false;

        liveAllDateHeaders.forEach((dh) => {
          const item = updateMap.get(`${csvRow.rowKey}||${dh}`);
          if (item) {
            cellMap[dh] = item;
            hasAny = true;
          }
        });

        if (!hasAny) return null;

        return {
          rowKey: csvRow.rowKey,
          static: { ...csvRow.static },
          liveCells: cellMap
        };
      })
      .filter(Boolean);
  }

  /* -------------------------------------------------------
     Current view data / columns
  ------------------------------------------------------- */
  function getCurrentSourceRows() {
    return currentView === "live" ? liveRows : csvRows;
  }

  function getCurrentAllDateHeaders() {
    return currentView === "live" ? liveAllDateHeaders : csvAllDateHeaders;
  }

  function getVisibleDateHeaders() {
    return getCurrentAllDateHeaders().filter((dh) => isDateWithinRange(dh, selectedStartDate, selectedEndDate));
  }

  function getVisibleStaticColumns() {
    const rows = getCurrentSourceRows();

    return staticColumns.filter((col) => {
      if (!col.hideable) return true;
      if (hiddenStaticColumns.has(col.key)) return false;

      const hasAnyValue = rows.some((r) => trim(r.static[col.key]) !== "");
      return hasAnyValue;
    });
  }

  function getCurrentColumns() {
    const staticCols = getVisibleStaticColumns().map((col) => ({
      type: "static",
      key: col.key,
      label: col.label
    }));

    const dateCols = getVisibleDateHeaders().map((dh) => ({
      type: "date",
      key: dh,
      label: dh
    }));

    return [...staticCols, ...dateCols];
  }

  function getCellText(row, col) {
    if (col.type === "static") {
      return trim(row.static[col.key] ?? "");
    }

    if (currentView === "live") {
      return trim(row.liveCells?.[col.key]?.value ?? "");
    }

    return trim(row.dates?.[col.key] ?? "");
  }

  function getLiveCellMeta(row, dateKey) {
    if (currentView !== "live") return null;
    return row.liveCells?.[dateKey] || null;
  }

  function getFilteredRowsBase(excludeColumnKey = null) {
    const rows = getCurrentSourceRows();

    return rows.filter((row) => {
      if (!matchesAlpha(row.static.agentName || "", selectedAlpha)) return false;

      const cols = getCurrentColumns();
      for (const col of cols) {
        if (excludeColumnKey && col.key === excludeColumnKey) continue;

        const selected = headerFilterState[col.key];
        if (!selected || !selected.size) continue;

        const value = trim(getCellText(row, col) || "");
        if (!selected.has(value)) return false;
      }

      return true;
    });
  }

  function getDisplayedRows() {
    return getFilteredRowsBase();
  }

  function getDistinctValuesForColumn(colKey) {
    const rows = getFilteredRowsBase(colKey);
    const col = getCurrentColumns().find((c) => c.key === colKey);
    if (!col) return [];

    const values = rows.map((r) => trim(getCellText(r, col) || ""));
    return uniqueSorted(values);
  }

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  function renderHeader() {
    const cols = getCurrentColumns();

    headRow.innerHTML = cols.map((col) => {
      const active = headerFilterState[col.key] && headerFilterState[col.key].size ? "is-active" : "";
      return `
        <th data-col-key="${esc(col.key)}">
          <div class="ms-th-inner">
            <div class="ms-th-main">
              <span class="ms-th-label">${esc(col.label)}</span>
            </div>
            <button type="button" class="ms-th-filter ${active}" data-filter-col="${esc(col.key)}">▼</button>
          </div>
        </th>
      `;
    }).join("");

    document.querySelectorAll("[data-filter-col]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const colKey = btn.getAttribute("data-filter-col");
        if (!colKey) return;

        if (!filterPopover.hidden && activeFilterColumn === colKey) {
          closeHeaderFilterPopover();
          return;
        }

        openHeaderFilterPopover(colKey, btn);
      });
    });
  }

  function renderBody() {
    const cols = getCurrentColumns();
    const rows = getDisplayedRows();

    if (!rows.length) {
      tbody.innerHTML = `<tr><td class="ms-empty-cell" colspan="${Math.max(cols.length, 1)}">No rows found for the current filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const cells = cols.map((col) => {
        const value = getCellText(row, col);
        let cellClass = "";

        if (col.type === "date" && currentView === "live") {
          const meta = getLiveCellMeta(row, col.key);
          if (meta && meta.changed) {
            if (meta.sourceType === "Weekly") cellClass = "ms-cell-weekly";
            if (meta.sourceType === "Change") cellClass = "ms-cell-change";
            if (meta.sourceType === "Swap") cellClass = "ms-cell-swap";
          }
        }

        return `<td class="${cellClass}">${esc(value)}</td>`;
      }).join("");

      return `<tr>${cells}</tr>`;
    }).join("");
  }

  function updateStatusText() {
    const rows = getDisplayedRows();
    const cols = getCurrentColumns();
    const modeText = currentView === "live" ? "Live Submission View loaded" : "CSV View loaded";
    setBanner(`${modeText} · Rows: ${rows.length} · Columns: ${cols.length}`, "info");
  }

  function updateLegendCounts() {
    const rows = getDisplayedRows();
    const dates = getVisibleDateHeaders();

    const weeklyReqs = new Set();
    const changeReqs = new Set();
    const swapReqs = new Set();

    rows.forEach((row) => {
      dates.forEach((dateKey) => {
        const meta = row.liveCells?.[dateKey];
        if (!meta || !meta.requestId) return;

        if (meta.sourceType === "Weekly") weeklyReqs.add(meta.requestId);
        if (meta.sourceType === "Change") changeReqs.add(meta.requestId);
        if (meta.sourceType === "Swap") swapReqs.add(meta.requestId);
      });
    });

    countWeeklyReq.textContent = weeklyReqs.size;
    countChangeReq.textContent = changeReqs.size;
    countSwapReq.textContent = swapReqs.size;
  }

  function renderCurrentView() {
    renderHeader();
    renderBody();
    updateStatusText();
    updateLegendCounts();
    syncBottomScrollWidth();
  }

  function activateView(viewName) {
    currentView = viewName;

    btnCsvView.classList.toggle("active", viewName === "csv");
    btnLiveView.classList.toggle("active", viewName === "live");

    const defaultRange = buildDefaultRangeForView(viewName);
    if (defaultRange) {
      selectedStartDate = defaultRange.start;
      selectedEndDate = defaultRange.end;
      updateDateTitleAndInputs();
    }

    renderCurrentView();
  }

  /* -------------------------------------------------------
     Header filter popover
  ------------------------------------------------------- */
  function openHeaderFilterPopover(colKey, anchorEl) {
    activeFilterColumn = colKey;
    activeFilterAnchor = anchorEl;
    activeFilterDraft = new Set(
      headerFilterState[colKey]
        ? Array.from(headerFilterState[colKey])
        : getDistinctValuesForColumn(colKey)
    );

    const col = getCurrentColumns().find((c) => c.key === colKey);
    filterTitle.textContent = `Filter: ${col ? col.label.toLowerCase() : "column"}`;
    filterSearch.value = "";
    renderFilterList("");

    filterPopover.hidden = false;

    const rect = anchorEl.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = Math.max(8, Math.min(rect.left + window.scrollX - 200 + rect.width, window.innerWidth - 260));
    filterPopover.style.top = `${top}px`;
    filterPopover.style.left = `${left}px`;
  }

  function closeHeaderFilterPopover() {
    filterPopover.hidden = true;
    activeFilterColumn = null;
    activeFilterAnchor = null;
    activeFilterDraft = new Set();
  }

  function renderFilterList(searchText) {
    if (!activeFilterColumn) return;

    const q = norm(searchText);
    const values = getDistinctValuesForColumn(activeFilterColumn).filter((v) => {
      const raw = trim(v);
      return !q || norm(raw).includes(q);
    });

    if (!values.length) {
      filterList.innerHTML = `<div class="ms-filter-empty">No matching values</div>`;
      return;
    }

    filterList.innerHTML = values.map((v) => {
      const raw = trim(v);
      const checked = activeFilterDraft.has(raw) ? "checked" : "";
      return `
        <label class="ms-filter-item">
          <input type="checkbox" value="${esc(raw)}" ${checked}>
          <span>${esc(raw || "(blank)")}</span>
        </label>
      `;
    }).join("");

    filterList.querySelectorAll("input[type='checkbox']").forEach((cb) => {
      cb.addEventListener("change", () => {
        const val = trim(cb.value || "");
        if (cb.checked) activeFilterDraft.add(val);
        else activeFilterDraft.delete(val);
      });
    });
  }

  function applyHeaderFilterDraft() {
    if (!activeFilterColumn) return;

    const allVals = getDistinctValuesForColumn(activeFilterColumn).map((v) => trim(v));
    const selectedVals = Array.from(activeFilterDraft).map((v) => trim(v));

    if (!selectedVals.length || selectedVals.length === allVals.length) {
      delete headerFilterState[activeFilterColumn];
    } else {
      headerFilterState[activeFilterColumn] = new Set(selectedVals);
    }

    closeHeaderFilterPopover();
    renderCurrentView();
  }

  function resetCurrentHeaderFilter() {
    if (!activeFilterColumn) return;
    delete headerFilterState[activeFilterColumn];
    closeHeaderFilterPopover();
    renderCurrentView();
  }

  /* -------------------------------------------------------
     Hide columns popup
  ------------------------------------------------------- */
  function openHideColumnsModal() {
    hideColumnDraft = new Set(hiddenStaticColumns);

    const hideableCols = staticColumns.filter((c) => c.key !== "agentName");
    hideColsList.innerHTML = hideableCols.map((col) => {
      const checked = !hideColumnDraft.has(col.key) ? "checked" : "";
      return `
        <label class="ms-hide-item">
          <input type="checkbox" data-hide-col="${esc(col.key)}" ${checked}>
          <span>${esc(col.label)}</span>
        </label>
      `;
    }).join("");

    openModal(hideColsModal);
  }

  function applyHideColumns() {
    hiddenStaticColumns = new Set();

    hideColsList.querySelectorAll("input[data-hide-col]").forEach((cb) => {
      const key = cb.getAttribute("data-hide-col");
      if (!cb.checked && key !== "agentName") {
        hiddenStaticColumns.add(key);
      }
    });

    closeModal(hideColsModal);
    renderCurrentView();
  }

  /* -------------------------------------------------------
     Summary modal
  ------------------------------------------------------- */
  function openSummaryModal() {
    const displayedRows = getDisplayedRows();
    const visibleDates = getVisibleDateHeaders();

    summarySub.textContent = `${currentView === "live" ? "Live Submission View" : "CSV View"} · ${displayedRows.length} rows · ${visibleDates.length} date columns`;

    if (!displayedRows.length || !visibleDates.length) {
      summaryWrap.innerHTML = `<div class="ms-summary-empty">No visible rows or date columns to summarize.</div>`;
      openModal(summaryModal);
      return;
    }

    const headerHtml = `
      <tr>
        <th>Agent Name</th>
        ${visibleDates.map((dh) => `<th>${esc(dh)}</th>`).join("")}
      </tr>
    `;

    const rowHtml = displayedRows.map((row) => {
      const cells = visibleDates.map((dh) => {
        const val = currentView === "live"
          ? trim(row.liveCells?.[dh]?.value ?? "")
          : trim(row.dates?.[dh] ?? "");
        return `<td>${esc(val)}</td>`;
      }).join("");

      return `
        <tr>
          <td>${esc(row.static.agentName || "")}</td>
          ${cells}
        </tr>
      `;
    }).join("");

    summaryWrap.innerHTML = `
      <table class="ms-summary-table">
        <thead>${headerHtml}</thead>
        <tbody>${rowHtml}</tbody>
      </table>
    `;

    openModal(summaryModal);
  }

  /* -------------------------------------------------------
     Refresh behavior
  ------------------------------------------------------- */
  function refreshTableView() {
    headerFilterState = {};
    selectedAlpha = "All";

    alphaWrap.querySelectorAll(".ms-alpha-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-alpha") === "All");
    });

    applyDefaultRangeForCurrentView();
    closeHeaderFilterPopover();
    closeDatePopover();
    renderCurrentView();
  }

  /* -------------------------------------------------------
     Date presets and controls
  ------------------------------------------------------- */
  function applyPreset(name) {
    const dates = getCurrentAllDateHeaders()
      .map(parseScheduleDateHeader)
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (!dates.length) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let s = null;
    let e = null;

    switch (name) {
      case "today":
        s = new Date(now);
        e = new Date(now);
        break;

      case "tomorrow":
        s = addDays(now, 1);
        e = addDays(now, 1);
        break;

      case "thisweek": {
        s = new Date(now);
        s.setDate(now.getDate() - now.getDay());
        s.setHours(0, 0, 0, 0);
        e = addDays(s, 6);
        break;
      }

      case "nextweek": {
        s = new Date(now);
        s.setDate(now.getDate() - now.getDay() + 7);
        s.setHours(0, 0, 0, 0);
        e = addDays(s, 6);
        break;
      }

      case "lastweek": {
        s = new Date(now);
        s.setDate(now.getDate() - now.getDay() - 7);
        s.setHours(0, 0, 0, 0);
        e = addDays(s, 6);
        break;
      }

      case "thismonth":
        s = new Date(now.getFullYear(), now.getMonth(), 1);
        e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;

      case "lastmonth":
        s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        e = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case "all":
      default:
        s = dates[0];
        e = dates[dates.length - 1];
        break;
    }

    setDateRange(s, e);
  }

  /* -------------------------------------------------------
     Scroll sync
  ------------------------------------------------------- */
  function bindScrollSync() {
    let syncing = false;

    tableWrap.addEventListener("scroll", () => {
      if (syncing) return;
      syncing = true;
      bottomScroll.scrollLeft = tableWrap.scrollLeft;
      requestAnimationFrame(() => { syncing = false; });
    });

    bottomScroll.addEventListener("scroll", () => {
      if (syncing) return;
      syncing = true;
      tableWrap.scrollLeft = bottomScroll.scrollLeft;
      requestAnimationFrame(() => { syncing = false; });
    });

    window.addEventListener("resize", syncBottomScrollWidth);
  }

  /* -------------------------------------------------------
     Events
  ------------------------------------------------------- */
  btnCsvView.addEventListener("click", () => activateView("csv"));
  btnLiveView.addEventListener("click", () => activateView("live"));

  btnHideColumns.addEventListener("click", openHideColumnsModal);
  hideColsClose.addEventListener("click", () => closeModal(hideColsModal));
  hideColsCancel.addEventListener("click", () => closeModal(hideColsModal));
  hideColsApply.addEventListener("click", applyHideColumns);
  hideColsModal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-hide='1']")) closeModal(hideColsModal);
  });

  btnViewSummary.addEventListener("click", openSummaryModal);
  summaryClose.addEventListener("click", () => closeModal(summaryModal));
  summaryClose2.addEventListener("click", () => closeModal(summaryModal));
  summaryModal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-summary='1']")) closeModal(summaryModal);
  });

  btnRefreshTable.addEventListener("click", refreshTableView);

  alphaWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".ms-alpha-btn");
    if (!btn) return;

    selectedAlpha = btn.getAttribute("data-alpha") || "All";
    alphaWrap.querySelectorAll(".ms-alpha-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    renderCurrentView();
  });

  dateBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pop.hidden = !pop.hidden;
  });

  dpCancel.addEventListener("click", closeDatePopover);

  dpApply.addEventListener("click", () => {
    const s = fromInputDateValue(dpStart.value);
    const e = fromInputDateValue(dpEnd.value);
    if (!s || !e) return;
    setDateRange(s, e);
    closeDatePopover();
  });

  wkPrev.addEventListener("click", () => {
    if (!selectedStartDate || !selectedEndDate) return;
    const span = getRangeSpanDays() + 1;
    setDateRange(addDays(selectedStartDate, -span), addDays(selectedEndDate, -span));
  });

  wkNext.addEventListener("click", () => {
    if (!selectedStartDate || !selectedEndDate) return;
    const span = getRangeSpanDays() + 1;
    setDateRange(addDays(selectedStartDate, span), addDays(selectedEndDate, span));
  });

  document.querySelectorAll(".ms-dp-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyPreset(btn.getAttribute("data-preset") || "all");
      closeDatePopover();
    });
  });

  filterClose.addEventListener("click", closeHeaderFilterPopover);
  filterSearch.addEventListener("input", () => renderFilterList(filterSearch.value || ""));
  filterSelectAll.addEventListener("click", () => {
    if (!activeFilterColumn) return;
    activeFilterDraft = new Set(getDistinctValuesForColumn(activeFilterColumn));
    renderFilterList(filterSearch.value || "");
  });
  filterClear.addEventListener("click", () => {
    activeFilterDraft = new Set();
    renderFilterList(filterSearch.value || "");
  });
  filterApply.addEventListener("click", applyHeaderFilterDraft);
  filterResetCol.addEventListener("click", resetCurrentHeaderFilter);

  document.addEventListener("click", (e) => {
    if (!filterPopover.hidden) {
      if (!filterPopover.contains(e.target) && !e.target.closest("[data-filter-col]")) {
        closeHeaderFilterPopover();
      }
    }

    if (!pop.hidden) {
      if (!pop.contains(e.target) && !dateBtn.contains(e.target)) {
        closeDatePopover();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeHeaderFilterPopover();
      closeDatePopover();
      if (!hideColsModal.hidden) closeModal(hideColsModal);
      if (!summaryModal.hidden) closeModal(summaryModal);
    }
  });

  /* -------------------------------------------------------
     Boot
  ------------------------------------------------------- */
  try {
    setBanner("Loading CSV schedule...", "info");
    await loadCsvData();

    setBanner("Loading live submissions...", "info");
    await buildLiveData();

    bindScrollSync();

    const defaultRange = buildDefaultRangeForView("live") || buildDefaultRangeForView("csv");
    if (defaultRange) {
      selectedStartDate = defaultRange.start;
      selectedEndDate = defaultRange.end;
      updateDateTitleAndInputs();
    }

    currentView = "live";
    btnCsvView.classList.remove("active");
    btnLiveView.classList.add("active");

    renderCurrentView();
  } catch (err) {
    console.error("Master Schedule load error:", err);
    headRow.innerHTML = `<th>Error</th>`;
    tbody.innerHTML = `<tr><td class="ms-empty-cell">${esc(err.message || "Load error")}</td></tr>`;
    setBanner(`Failed to load schedule: ${err.message || "Unknown error"}`, "error");
  }
});
