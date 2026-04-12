(function () {

  function normalizePath(p) {
    return (p || "").toLowerCase().replace(/\/+$/, "") + "/";
  }

  const current = normalizePath(location.pathname);
  const nav = document.getElementById("mrNav");

  if (!nav) return;

  const links = nav.querySelectorAll("a[href]");
  let matched = null;

  links.forEach(function (a) {
    const href = a.getAttribute("href") || "";

    if (!href.startsWith("/")) return;

    const h = normalizePath(href);

    if (current === h || current.startsWith(h)) {
      if (
        !matched ||
        h.length > normalizePath(matched.getAttribute("href")).length
      ) {
        matched = a;
      }
    }
  });

  // Apply active state
  if (matched) {
    links.forEach(function (a) {
      a.classList.remove("is-active");
    });
    matched.classList.add("is-active");
  }

})();
