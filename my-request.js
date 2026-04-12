(function () {
  const titleEl = document.getElementById("mrTitle");
  const blankEl = document.getElementById("mrBlank");
  const navLinks = document.querySelectorAll("#mrNav a[data-key]");

  const SECTIONS = {
    "request-center": {
      title: "Request Center",
      message: "Request Center page will open here next."
    },
    "approvals-console": {
      title: "Approvals Console",
      message: "Approvals Console page will open here next."
    }
  };

  function getSectionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const section = (params.get("section") || "").toLowerCase().trim();
    return SECTIONS[section] ? section : "";
  }

  function setActive(sectionKey) {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.key === sectionKey);
    });
  }

  function renderSection(sectionKey) {
    if (!sectionKey || !SECTIONS[sectionKey]) {
      titleEl.textContent = "My Request";
      blankEl.textContent = "Please select an option from the left.";
      setActive("");
      return;
    }

    titleEl.textContent = "My Request";
    blankEl.textContent = SECTIONS[sectionKey].message;
    setActive(sectionKey);
  }

  renderSection(getSectionFromUrl());
})();
