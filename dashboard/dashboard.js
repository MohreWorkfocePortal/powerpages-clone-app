(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const sel = $("dh-select");
  const frame = $("dh-frame");
  const ph = $("dh-placeholder");
  const loading = $("dh-loading");
  const coming = $("dh-coming");
  const errorBox = $("dh-error");
  const comingSub = $("dh-coming-sub");
  const errorSub = $("dh-error-sub");

  if (!sel || !frame) return;

  const DASHBOARDS = [
    {
      id: "wfm_hc",
      name: "WFM Headcount Dashboard (Live)",
      url: "#"
    },
    {
      id: "qa",
      name: "MOHRE Quality Assurance Live Dashboard",
      url: "#"
    },
    {
      id: "tech",
      name: "MOHRE Technical Support Live Dashboard",
      url: "#",
      comingSoon: true,
      note: "This dashboard is marked as Coming soon."
    }
  ];

  function hideAllStates() {
    if (ph) ph.style.display = "none";
    if (loading) loading.style.display = "none";
    if (coming) coming.style.display = "none";
    if (errorBox) errorBox.style.display = "none";
    frame.style.display = "none";
    frame.classList.remove("is-ready");
  }

  function resetView() {
    hideAllStates();
    if (ph) ph.style.display = "flex";
    frame.removeAttribute("src");
  }

  function showComing(message) {
    hideAllStates();
    if (comingSub) {
      comingSub.textContent = message || "This dashboard is not published yet.";
    }
    if (coming) coming.style.display = "flex";
  }

  function showLoading() {
    hideAllStates();
    if (loading) loading.style.display = "flex";
  }

  function showError(message) {
    hideAllStates();
    if (errorSub) {
      errorSub.textContent = message || "The selected dashboard could not be displayed.";
    }
    if (errorBox) errorBox.style.display = "flex";
  }

  function buildDropdown() {
    sel.innerHTML = `<option value="" selected disabled>— Select —</option>`;
    DASHBOARDS.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
  }

  function handleChange() {
    const d = DASHBOARDS.find((x) => x.id === sel.value);

    if (!d) {
      resetView();
      return;
    }

    if (d.comingSoon) {
      showComing(d.note || `${d.name} is not published yet.`);
      return;
    }

    if (!d.url || d.url === "#") {
      showError(`"${d.name}" is not linked yet. Add the real dashboard URL inside dashboard.js.`);
      return;
    }

    showLoading();

    frame.onload = function () {
      hideAllStates();
      frame.style.display = "block";
      frame.classList.add("is-ready");
    };

    frame.onerror = function () {
      showError(`"${d.name}" could not be loaded.`);
    };

    frame.src = d.url;
  }

  buildDropdown();
  resetView();
  sel.addEventListener("change", handleChange);
})();
