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

  const avatarBtn = $("ppAvatarBtn");
  const pop = $("ppProfilePopover");
  const nowTime = $("ppNowTime");

  if (!sel || !frame) return;

  const DASHBOARDS = [
    {
      id: "wfm_hc",
      name: "WFM Headcount Dashboard (Live)",
      url: "wfm-headcount-dashboard.html",
      comingSoon: true,
      note: "This dashboard page is not created yet."
    },
    {
      id: "qa",
      name: "MOHRE Quality Assurance Live Dashboard",
      url: "mohre-quality-assurance-live-dashboard.html",
      comingSoon: true,
      note: "This dashboard page is not created yet."
    },
    {
      id: "tech",
      name: "MOHRE Technical Support Live Dashboard",
      url: "mohre-technical-support-live-dashboard.html",
      comingSoon: true,
      note: "This dashboard page is not created yet."
    }
  ];

  function hideAllStates() {
    if (ph) ph.style.display = "none";
    if (loading) loading.style.display = "none";
    if (coming) coming.style.display = "none";
    if (errorBox) errorBox.style.display = "none";
  }

  function resetFrame() {
    frame.classList.remove("is-ready");
    frame.style.display = "none";
    frame.removeAttribute("src");
  }

  function resetView() {
    hideAllStates();
    resetFrame();
    if (ph) ph.style.display = "flex";
  }

  function showComing(message) {
    hideAllStates();
    resetFrame();
    if (comingSub) {
      comingSub.textContent = message || "This dashboard is not published yet.";
    }
    if (coming) coming.style.display = "flex";
  }

  function showError(message) {
    hideAllStates();
    resetFrame();
    if (errorSub) {
      errorSub.textContent = message || "The selected dashboard could not be displayed.";
    }
    if (errorBox) errorBox.style.display = "flex";
  }

  function showLoading() {
    hideAllStates();
    resetFrame();
    if (loading) loading.style.display = "flex";
  }

  function showFrame(url) {
    showLoading();

    frame.onload = function () {
      hideAllStates();
      frame.style.display = "block";
      frame.classList.add("is-ready");
    };

    frame.onerror = function () {
      showError("The selected dashboard page could not be loaded.");
    };

    frame.src = url;
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

    showFrame(d.url);
  }

  function closePop() {
    if (!pop || !avatarBtn) return;
    pop.classList.remove("is-open");
    pop.setAttribute("aria-hidden", "true");
    avatarBtn.setAttribute("aria-expanded", "false");
  }

  function openPop() {
    if (!pop || !avatarBtn) return;
    pop.classList.add("is-open");
    pop.setAttribute("aria-hidden", "false");
    avatarBtn.setAttribute("aria-expanded", "true");
  }

  function setNowTime() {
    if (!nowTime) return;
    const d = new Date();
    const opts = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    nowTime.textContent = d.toLocaleString(undefined, opts);
  }

  if (avatarBtn && pop) {
    avatarBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      pop.classList.contains("is-open") ? closePop() : openPop();
    });

    document.addEventListener("click", function (ev) {
      if (!ev.target.closest(".pp-profile")) closePop();
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") closePop();
    });
  }

  buildDropdown();
  resetView();
  sel.addEventListener("change", handleChange);
  setNowTime();
  setInterval(setNowTime, 60000);
})();
