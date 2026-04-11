const slides = [
  {
    title: "Scheduling & Coverage",
    note: "Illustrative operational summary (no live data yet).",
    kpi1Label: "Capacity health",
    kpi1Value: "Balanced",
    kpi2Label: "Focus",
    kpi2Value: "Maintain stability",
    kpi3Label: "Posture",
    kpi3Value: "Monitoring",
  },
  {
    title: "Headcount & Certification",
    note: "Track readiness, certification, and staffing alignment.",
    kpi1Label: "Readiness",
    kpi1Value: "Stable",
    kpi2Label: "Focus",
    kpi2Value: "Certification gaps",
    kpi3Label: "Posture",
    kpi3Value: "Reviewing",
  },
  {
    title: "Performance & KPIs",
    note: "Monitor quality, SLA, and overall efficiency indicators.",
    kpi1Label: "SLA",
    kpi1Value: "On target",
    kpi2Label: "Focus",
    kpi2Value: "Efficiency",
    kpi3Label: "Posture",
    kpi3Value: "Tracking",
  },
  {
    title: "Requests & Support",
    note: "Submit and manage workforce operational requests.",
    kpi1Label: "Requests",
    kpi1Value: "Active",
    kpi2Label: "Focus",
    kpi2Value: "Response time",
    kpi3Label: "Posture",
    kpi3Value: "Open",
  },
  {
    title: "Compliance & Controls",
    note: "Review policies, controls, and operational exceptions.",
    kpi1Label: "Compliance",
    kpi1Value: "Healthy",
    kpi2Label: "Focus",
    kpi2Value: "Exceptions",
    kpi3Label: "Posture",
    kpi3Value: "Auditing",
  },
];

let currentSlide = 0;
let isPaused = false;
let autoSlide = null;

const titleEl = document.getElementById("wfm-slide-title");
const noteEl = document.getElementById("wfm-slide-note");
const dots = document.querySelectorAll(".wfm-dot");
const prevBtn = document.getElementById("wfm-prev");
const nextBtn = document.getElementById("wfm-next");
const pauseBtn = document.getElementById("wfm-pause");

const kpi1Label = document.getElementById("wfm-kpi-1-label");
const kpi1Value = document.getElementById("wfm-kpi-1-value");
const kpi2Label = document.getElementById("wfm-kpi-2-label");
const kpi2Value = document.getElementById("wfm-kpi-2-value");
const kpi3Label = document.getElementById("wfm-kpi-3-label");
const kpi3Value = document.getElementById("wfm-kpi-3-value");

const modal = document.getElementById("wfm-modal");
const aboutBtn = document.getElementById("wfm-about-footer");
const closeModalBtn = document.getElementById("wfm-modal-close");
const yearEl = document.getElementById("wfm-year");

const searchInput = document.getElementById("wfm-search");
const tabs = document.querySelectorAll(".wfm-tab");
const cards = document.querySelectorAll(".wfm-tool");

function renderSlide(index) {
  const slide = slides[index];

  titleEl.innerHTML = `${slide.title} <span>(illustrative)</span>`;
  noteEl.textContent = slide.note;

  kpi1Label.textContent = slide.kpi1Label;
  kpi1Value.textContent = slide.kpi1Value;
  kpi2Label.textContent = slide.kpi2Label;
  kpi2Value.textContent = slide.kpi2Value;
  kpi3Label.textContent = slide.kpi3Label;
  kpi3Value.textContent = slide.kpi3Value;

  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === index);
  });
}

function goToSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  renderSlide(currentSlide);
}

function nextSlide() {
  goToSlide(currentSlide + 1);
}

function prevSlide() {
  goToSlide(currentSlide - 1);
}

function startAutoSlide() {
  stopAutoSlide();
  autoSlide = setInterval(() => {
    if (!isPaused) nextSlide();
  }, 4000);
}

function stopAutoSlide() {
  if (autoSlide) {
    clearInterval(autoSlide);
    autoSlide = null;
  }
}

function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Play" : "Pause";
  pauseBtn.setAttribute("aria-pressed", String(isPaused));
}

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function filterCards() {
  const activeTab = document.querySelector(".wfm-tab.is-active")?.dataset.tab || "most";
  const query = searchInput?.value.trim().toLowerCase() || "";

  cards.forEach((card) => {
    const groups = card.dataset.group.toLowerCase();
    const keywords = card.dataset.keywords.toLowerCase();
    const title = card.textContent.toLowerCase();

    const tabMatch = activeTab === "all" || groups.includes(activeTab);
    const searchMatch = !query || keywords.includes(query) || title.includes(query);

    card.style.display = tabMatch && searchMatch ? "block" : "none";
  });
}

prevBtn?.addEventListener("click", prevSlide);
nextBtn?.addEventListener("click", nextSlide);
pauseBtn?.addEventListener("click", togglePause);

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => goToSlide(index));
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    filterCards();
  });
});

searchInput?.addEventListener("input", filterCards);

aboutBtn?.addEventListener("click", openModal);
closeModalBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

renderSlide(currentSlide);
filterCards();
startAutoSlide();
