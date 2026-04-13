(function () {
  const SECTIONS = {
    overview: {
      label: "Performance Overview",
      tiles: [
        { title: "Performance Overview", url: "#", icon: "trend" }
      ]
    },
    version: {
      label: "Version Control",
      tiles: [
        { title: "Version Control", url: "#", icon: "doc" }
      ]
    },
    metrics: {
      label: "Metrics Definitions",
      tiles: [
        { title: "Metrics Definitions", url: "#", icon: "doc" }
      ]
    },
    kpis: {
      label: "KPIs",
      tiles: [
        { title: "Overall Operational KPIs", url: "#", icon: "trend" },
        { title: "KPI Definitions", url: "#", icon: "doc" }
      ]
    }
  };

  const ICONS = {
    trend: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 16l6-6 4 4 6-8"></path>
        <path d="M20 6v6h-6"></path>
      </svg>
    `,
    doc: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h8l4 4v14H6V3Z"></path>
        <path d="M14 3v5h5"></path>
        <path d="M8 12h8"></path>
        <path d="M8 16h6"></path>
      </svg>
    `
  };

  const titleEl = document.getElementById("pfTitle");
  const tilesEl = document.getElementById("pfTiles");
  const emptyEl = document.getElementById("pfEmpty");
  const navEl = document.getElementById("pfNav");

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
      a.className = "pf-tile";
      a.href = t.url || "#";

      a.innerHTML = `
        <div class="pf-tile-text">${t.title}</div>
        <div class="pf-tile-ico" aria-hidden="true">${ICONS[t.icon] || ICONS.doc}</div>
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
