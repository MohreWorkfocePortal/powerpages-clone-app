(function () {
  const ICONS = {
    list: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14"></path>
        <path d="M5 12h14"></path>
        <path d="M5 17h14"></path>
      </svg>
    `,
    people: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 11a4 4 0 1 0-8 0"></path>
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7"></path>
      </svg>
    `,
    cap: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7l9-4 9 4-9 4-9-4Z"></path>
        <path d="M6 10v6c0 2 3 4 6 4s6-2 6-4v-6"></path>
      </svg>
    `,
    shield: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 11l2 2 4-4"></path>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
      </svg>
    `,
    clipboard: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4h6"></path>
        <path d="M9 4a2 2 0 0 0-2 2v15h10V6a2 2 0 0 0-2-2"></path>
        <path d="M9 9h6"></path>
        <path d="M9 13h6"></path>
        <path d="M9 17h5"></path>
      </svg>
    `,
    file: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
      </svg>
    `,
    chart: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5"></path>
        <path d="M4 19h16"></path>
        <path d="M8 16v-5"></path>
        <path d="M12 16V8"></path>
        <path d="M16 16v-3"></path>
      </svg>
    `,
    briefcase: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 6h4"></path>
        <path d="M10 6a2 2 0 0 1 2-2a2 2 0 0 1 2 2"></path>
        <path d="M4 8h16v12H4z"></path>
        <path d="M4 13h16"></path>
      </svg>
    `,
    bolt: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6Z"></path>
      </svg>
    `,
    book: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19a2 2 0 0 0 2 2h14"></path>
        <path d="M6 2h14v19H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"></path>
        <path d="M8 6h10"></path>
        <path d="M8 10h10"></path>
        <path d="M8 14h6"></path>
      </svg>
    `
  };

  document.querySelectorAll('.oa-nav-ico[data-ico]').forEach((el) => {
    const k = el.getAttribute('data-ico');
    el.innerHTML = ICONS[k] || ICONS.list;
  });

  const SECTIONS = {
    qa: {
      label: "Quality Assurance",
      tiles: [
        { title: "Call Monitoring", url: "#", icon: "shield" },
        { title: "Coaching and Calibration", url: "#", icon: "clipboard" },
        { title: "Compliance Review", url: "#", icon: "file" },
        { title: "Case Audits", url: "#", icon: "briefcase" },
        { title: "Quality Reporting", url: "#", icon: "chart" }
      ]
    },
    pm: {
      label: "People Management",
      tiles: [
        { title: "Performance Review", url: "#", icon: "chart" },
        { title: "Agent Coaching", url: "#", icon: "clipboard" },
        { title: "Attendance Management", url: "#", icon: "briefcase" },
        { title: "Schedule Adherence", url: "#", icon: "chart" },
        { title: "Productivity Tracking", url: "#", icon: "chart" },
        { title: "Escalation Handling", url: "#", icon: "bolt" },
        { title: "Daily Team Reports", url: "#", icon: "file" }
      ]
    },
    td: {
      label: "Training and Development",
      tiles: [
        { title: "New Hire Training", url: "#", icon: "cap" },
        { title: "Refresher Training", url: "#", icon: "cap" },
        { title: "Training Evaluation", url: "#", icon: "book" },
        { title: "Knowledge Assessments", url: "#", icon: "book" },
        { title: "Certification Tracking", url: "#", icon: "file" }
      ]
    }
  };

  const titleEl = document.getElementById("oaTitle");
  const tilesEl = document.getElementById("oaTiles");
  const emptyEl = document.getElementById("oaEmpty");
  const navEl = document.getElementById("oaNav");

  function getSectionFromUrl() {
    const sp = new URLSearchParams(location.search);
    const q = (sp.get("section") || "").toLowerCase().trim();
    return SECTIONS[q] ? q : "";
  }

  function setActiveNav(sectionKey) {
    navEl.querySelectorAll("a[data-section]").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.section === sectionKey);
    });
  }

  function renderTiles(sectionKey) {
    if (!sectionKey || !SECTIONS[sectionKey]) {
      titleEl.textContent = "";
      setActiveNav("");
      tilesEl.innerHTML = "";
      emptyEl.style.display = "block";
      emptyEl.textContent = "Please select a section from the left.";
      return;
    }

    const section = SECTIONS[sectionKey];
    titleEl.textContent = section.label;
    setActiveNav(sectionKey);

    tilesEl.innerHTML = "";
    const tiles = section.tiles || [];

    if (!tiles.length) {
      emptyEl.style.display = "block";
      emptyEl.textContent = "No pages configured under this section yet.";
      return;
    }

    emptyEl.style.display = "none";

    tiles.forEach((t) => {
      const a = document.createElement("a");
      a.className = "oa-tile";
      a.href = t.url || "#";
      const svg = ICONS[t.icon] || ICONS.list;

      a.innerHTML = `
        <div class="oa-tile-text">${t.title}</div>
        <div class="oa-tile-ico" aria-hidden="true">${svg}</div>
      `;
      tilesEl.appendChild(a);
    });
  }

  function setSection(sectionKey, push) {
    renderTiles(sectionKey);

    if (push && sectionKey) {
      const url = new URL(location.href);
      url.searchParams.set("section", sectionKey);
      history.pushState({ section: sectionKey }, "", url.toString());
    }
  }

  navEl.addEventListener("click", function (e) {
    const a = e.target.closest("a[data-section]");
    if (!a) return;

    e.preventDefault();
    setSection(a.dataset.section, true);
  });

  window.addEventListener("popstate", function () {
    setSection(getSectionFromUrl(), false);
  });

  setSection(getSectionFromUrl(), false);
})();
