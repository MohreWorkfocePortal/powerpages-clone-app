(function () {

  /* =========================
     Mobile navigation toggle
  ========================== */
  const navBtn = document.querySelector('.pp-nav-toggle');
  const nav = document.getElementById('ppNav');

  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* =========================
     Profile popover
  ========================== */
  const avatarBtn = document.getElementById('ppAvatarBtn');
  const pop = document.getElementById('ppProfilePopover');

  function closePop() {
    if (!pop || !avatarBtn) return;
    pop.classList.remove('is-open');
    pop.setAttribute('aria-hidden', 'true');
    avatarBtn.setAttribute('aria-expanded', 'false');
  }

  function openPop() {
    if (!pop || !avatarBtn) return;
    pop.classList.add('is-open');
    pop.setAttribute('aria-hidden', 'false');
    avatarBtn.setAttribute('aria-expanded', 'true');
  }

  if (avatarBtn && pop) {
    avatarBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      pop.classList.contains('is-open') ? closePop() : openPop();
    });

    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.pp-profile')) closePop();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closePop();
    });
  }

  /* =========================
     Avatar upload (preview)
  ========================== */
  const fileInput = document.getElementById('ppAvatarFile');
  const smallImg = document.getElementById('ppAvatarImg');
  const largeImg = document.getElementById('ppAvatarImgLarge');
  const uploadHit = document.querySelector('.pp-avatar-upload');

  function triggerUpload(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if (fileInput) fileInput.click();
  }

  if (uploadHit) {
    uploadHit.addEventListener('click', triggerUpload);
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;

      const url = URL.createObjectURL(f);
      if (smallImg) smallImg.src = url;
      if (largeImg) largeImg.src = url;
    });
  }

  /* =========================
     Last login time (mock)
  ========================== */
  function setNowTime() {
    const el = document.getElementById('ppNowTime');
    if (!el) return;

    const d = new Date();
    const opts = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    el.textContent = d.toLocaleString(undefined, opts);
  }

  setNowTime();
  setInterval(setNowTime, 60000);

  /* =========================
     Simple breadcrumb (static version)
  ========================== */
  function buildBreadcrumb() {
    const bar = document.getElementById("ppHeaderCrumb");
    if (!bar) return;

    const path = window.location.pathname;

    // Simple mapping for your project
    if (path.includes("dashboard")) {
      bar.innerHTML = `
        <a href="../home.html">Home</a>
        <span class="pp-crumb-sep">›</span>
        <span>Dashboard</span>
      `;
      return;
    }

    // default = Home page (no breadcrumb)
    bar.innerHTML = "";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildBreadcrumb);
  } else {
    buildBreadcrumb();
  }

})();
