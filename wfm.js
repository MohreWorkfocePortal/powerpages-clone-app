(function () {
  const SECTIONS = {
    scheduling: {
      label: "Scheduling",
      tiles: [
        { title: "Schedule", url: "wfm/schedule.html", icon: "calendar" },
        { title: "Shift Summary", url: "#", icon: "chart" },
        { title: "Coverage", url: "#", icon: "tools" },
        { title: "Overtime", url: "#", icon: "hourglass" },
        { title: "Queue Performance", url: "#", icon: "trend" },
        { title: "Agent Compliance", url: "#", icon: "tools" }
      ]
    },
    leave: {
      label: "Leave and Time Off",
      tiles: [
        { title: "Annual Leave", url: "#", icon: "palm" },
        { title: "Time Off", url: "#", icon: "calendar" },
        { title: "Leave Balance", url: "#", icon: "chart" },
        { title: "Comp-Off Balance", url: "#", icon: "hourglass" }
      ]
    },
    attendance: {
      label: "Time and Attendance",
      tiles: [
        { title: "Attendance", url: "#", icon: "clock" },
        { title: "Payroll", url: "#", icon: "receipt" },
        { title: "Daily Login Compliance", url: "#", icon: "chart" }
      ]
    },
    requests: {
      label: "Requests and Submissions",
      tiles: [
        { title: "Schedule Change Requests", url: "#", icon: "receipt" },
        { title: "Overtime Requests", url: "#", icon: "hourglass" },
        { title: "Adherence Exceptions", url: "#", icon: "trend" },
        { title: "Leave Requests", url: "#", icon: "palm" },
        { title: "Comp-Off Requests", url: "#", icon: "calendar" }
      ]
    }
  };

  const ICONS = {
    calendar: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v3M17 3v3"></path>
        <path d="M4 8h16"></path>
        <rect x="4" y="6" width="16" height="15" rx="2"></rect>
        <path d="M8 12h3M13 12h3M8 16h3M13 16h3"></path>
      </svg>
    `,
    palm: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22v-9"></path>
        <path d="M12 13c-2.5-6.5-7-7-9-6 1 3 4 6 9 6Z"></path>
        <path d="M12 13c2.5-6.5 7-7 9-6-1 3-4 6-9 6Z"></path>
        <path d="M12 10c-1.2-3.5-4-5-6-5 1.2 2.6 3.1 4.2 6 5Z"></path>
        <path d="M12 10c1.2-3.5 4-5 6-5-1.2 2.6-3.1 4.2-6 5Z"></path>
      </svg>
    `,
    clock: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 7v6l4 2"></path>
      </svg>
    `,
    receipt: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z"></path>
        <path d="M9 7h6M9 11h6M9 15h5"></path>
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
    tools: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 7l3 3"></path>
        <path d="M5 19l6-6"></path>
        <path d="M16 3a4 4 0 0 0-3 6L5 17l2 2 8-8a4 4 0 0 0 6-3"></path>
      </svg>
    `,
    hourglass: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 2h12"></path>
        <path d="M6 22h12"></path>
        <path d="M8 2c0 6 8 6 8 10s-8 4-8 10"></path>
        <path d="M16 2c0 6-8 6-8 10s8 4 8 10"></path>
      </svg>
    `,
    trend: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 16l6-6 4 4 6-8"></path>
        <path d="M20 6v6h-6"></path>
      </svg>
    `
  };

  const titleEl = document.getElementById("wfmTitle");
  const tilesEl = document.getElementById("wfmTiles");
  const emptyEl = document.getElementById("wfmEmpty");
  const navLinks = document.querySelectorAll("#wfmNav a[data-section]");

  function getSectionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const section = (params.get("section") || "").toLowerCase().trim();
    return SECTIONS[section] ? section : "";
  }

  function setActive(sectionKey) {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.section === sectionKey);
    });
  }

  function renderSection(sectionKey) {
    const section = SECTIONS[sectionKey];

    if (!section) {
      titleEl.textContent = "";
      tilesEl.innerHTML = "";
      emptyEl.style.display = "block";
      setActive("");
      return;
    }

    titleEl.textContent = section.label;
    tilesEl.innerHTML = "";
    emptyEl.style.display = "none";
    setActive(sectionKey);

    section.tiles.forEach((tile) => {
      const a = document.createElement("a");
      a.className = "wfm-tile";
      a.href = tile.url || "#";

      a.innerHTML = `
        <span class="wfm-tile-text">${tile.title}</span>
        <span class="wfm-tile-ico" aria-hidden="true">
          ${ICONS[tile.icon] || ICONS.calendar}
        </span>
      `;

      tilesEl.appendChild(a);
    });
  }

  function init() {
    const sectionKey = getSectionFromUrl();
    renderSection(sectionKey);
  }

  init();
})();
