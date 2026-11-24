(function () {
  const C = CONFIG, app = document.getElementById("app"), qs = new URLSearchParams(location.search);
  const esc = s => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const tel = "tel:+" + C.PHONE, waNum = C.WHATSAPP || C.PHONE;
  const wa = t => "https://wa.me/" + waNum + "?text=" + encodeURIComponent(t || "Hi, I'd like to know more about your products.");
  const catUrl = c => "products.html?cat=" + encodeURIComponent(c);
  const STATIC = C.SHEET_CSV_URL ? new Set() : new Set(CATALOG.map(x => x.id));   // built-in products have their own page file
  const prodUrl = p => STATIC.has(p.id) ? "p/" + encodeURIComponent(p.id) + ".html" : "product.html?id=" + encodeURIComponent(p.id);
  const PH = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f7f3f2"/><path d="M200 90 L270 125 L270 200 L200 235 L130 200 L130 125 Z M130 125 L200 160 L270 125 M200 160 L200 235" fill="none" stroke="#b3121b" stroke-width="5" opacity=".5"/></svg>');
  document.addEventListener("error", e => { const t = e.target; if (t.tagName === "IMG" && !t.dataset.f) { t.dataset.f = 1; t.src = PH; } }, true);

  /* Category cover photos and home page picks (ids are the product photo names) */
  const COVER = { "Tail Lights": "atl-60", "Tractor Lights": "atl-36", "Side Lights": "sab-583", "Indicator Lights": "sc-puma", "Roof Lights": "arl-13a",
    "Fog Lights": "swift-b8", "Head & Halogen Lights": "sik-drl", "Football Lights": "fbl-16", "Eye Cat & Top Lights": "top-3eye",
    "AC DC Converters": "acdc-digital", "Mirrors & Accessories": "airgun-pvc", "LED Module Lights": "m-ram", "Mooch, Eagle, Bull & PL Lights": "bull-24" };
  const HERO = ["atl-60", "bull-24", "sab-583", "swift-b8"];
  const FEATURED = ["atl-61", "sc-puma", "ail-18a", "sik-drl", "mooch-r", "swift-y8", "top-3eye", "arl-13a"];

  function fixImg(u) {
    const m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/) || u.match(/[?&]id=([^&]+)/);
    return u.includes("drive.google.com") && m ? "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w800" : u;
  }
  const imgOf = p => p.image ? fixImg(p.image) : PH;

  function parseCSV(t) {
    const rows = []; let r = [], c = "", q = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (q) { if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { r.push(c); c = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; r.push(c); c = ""; if (r.some(v => v.trim())) rows.push(r); r = []; }
      else c += ch;
    }
    r.push(c); if (r.some(v => v.trim())) rows.push(r);
    const head = rows[0].map(h => h.trim().toLowerCase());
    return rows.slice(1).map(x => { const o = {}; head.forEach((h, i) => o[h] = (x[i] || "").trim()); return o; });
  }

  async function load() {
    let rows = CATALOG;
    if (C.SHEET_CSV_URL) {
      const res = await fetch(C.SHEET_CSV_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      rows = parseCSV(await res.text());
    }
    const seen = {};
    return rows.filter(p => p.name && (p.show || "").toLowerCase() !== "no").map(p => {
      let id = p.id || slug(p.name); seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id += "-" + seen[id];
      return Object.assign({}, p, { id });
    });
  }

  const card = p => `<article class="card">
    ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
    <a href="${prodUrl(p)}"><img src="${esc(imgOf(p))}" alt="${esc(p.name)}" loading="lazy"></a>
    <div class="info">
      ${p.category ? `<div class="cat">${esc(p.category)}</div>` : ""}
      <h3><a href="${prodUrl(p)}" style="text-decoration:none">${esc(p.name)}</a></h3>
      ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ""}
      ${p.price ? `<div class="price">${esc(p.price)}</div>` : `<div class="cat" style="margin-top:6px">Price on request</div>`}
      <div class="actions">
        <a class="btn call" href="${tel}">Call</a>
        <a class="btn wa" href="${wa("Hi, I'm interested in: " + p.name + (p.price ? " (" + p.price + ")" : ""))}" target="_blank" rel="noopener">WhatsApp</a>
      </div></div></article>`;

  /* ---------- shared header, side menu and footer ---------- */
  function shell(P, cats, count) {
    const page = document.body.dataset.page;
    const dd = cats.map(c => `<a href="${catUrl(c)}"><span>${esc(c)}</span><small>${count[c]}</small></a>`).join("");
    const sub = cats.map(c => `<a href="${catUrl(c)}">${esc(c)}</a>`).join("");
    app.innerHTML = `
    <div class="topbar"><div class="wrap"><span>${esc(C.HOURS)}</span><a href="${tel}">Call ${esc(C.PHONE_DISPLAY)}</a></div></div>
    <div class="overlay" id="overlay"></div>
    <aside class="drawer" id="drawer" aria-label="Menu" aria-hidden="true">
      <div class="drawer-head"><b>${esc(C.SHOP_NAME)}</b><button class="drawer-close" id="dclose" aria-label="Close menu">&times;</button></div>
      <div class="drawer-body">
        <form class="dsearch" action="products.html"><input name="q" type="search" placeholder="Search products" aria-label="Search products"></form>
        <nav>
          <a href="index.html">Home</a>
          <button class="acc" id="acc" aria-expanded="false">Products <span>&#9662;</span></button>
          <div class="sub"><a href="products.html">All products (${P.length})</a>${sub}</div>
          <a href="index.html#contact">Contact</a>
        </nav>
      </div>
      <div class="drawer-foot"><a class="btn call" href="${tel}">Call now</a><a class="btn wa" href="${wa()}" target="_blank" rel="noopener">WhatsApp</a></div>
    </aside>
    <header class="site"><div class="wrap">
      <button class="menu-btn" id="mbtn" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button>
      <a class="logo" href="index.html">${esc(C.SHOP_NAME)}</a>
      <nav class="nav" aria-label="Main">
        <a href="index.html" class="${page === "home" ? "on" : ""}">Home</a>
        <div class="dd"><button class="ddb ${page !== "home" ? "on" : ""}" aria-haspopup="true">Products &#9662;</button>
          <div class="dd-panel"><a class="all" href="products.html"><span>All products</span><small>${P.length}</small></a>${dd}</div></div>
        <a href="index.html#contact">Contact</a>
      </nav>
      <form class="search" action="products.html"><input name="q" type="search" placeholder="Search products" aria-label="Search products"></form>
      <a class="head-btn" href="${tel}">Call now</a>
    </div></header>
    <div id="page"></div>
    <footer id="foot"><div class="wrap">
      <div><h4>${esc(C.SHOP_NAME)}</h4><p>${esc(C.TAGLINE)}</p><p>LED auto lights and accessories</p></div>
      <div><h4>Categories</h4>${cats.slice(0, 7).map(c => `<p><a href="${catUrl(c)}">${esc(c)}</a></p>`).join("")}<p><a href="products.html">All products</a></p></div>
      <div><h4>Contact</h4><p>Phone: ${esc(C.PHONE_DISPLAY)}</p><p>${esc(C.ADDRESS)}</p><p><a href="mailto:${esc(C.EMAIL)}">${esc(C.EMAIL)}</a></p></div>
    </div></footer>
    <div class="float"><a class="f-wa" href="${wa()}" target="_blank" rel="noopener">WhatsApp</a><a class="f-call" href="${tel}">Call</a></div>`;

    const $ = id => document.getElementById(id), drawer = $("drawer"), overlay = $("overlay"), mbtn = $("mbtn"), dclose = $("dclose"), acc = $("acc");
    const open = () => { drawer.classList.add("open"); overlay.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); mbtn.setAttribute("aria-expanded", "true"); document.body.classList.add("lock"); dclose.focus(); };
    const close = () => { drawer.classList.remove("open"); overlay.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); mbtn.setAttribute("aria-expanded", "false"); document.body.classList.remove("lock"); };
    mbtn.onclick = open; dclose.onclick = close; overlay.onclick = close;
    acc.onclick = () => { const o = acc.classList.toggle("open"); acc.setAttribute("aria-expanded", o); };
    document.querySelectorAll(".drawer a").forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") { close(); document.activeElement.blur(); } });
  }

  /* ---------- home ---------- */
  function home(P, cats, count) {
    const byId = ids => ids.map(i => P.find(p => p.id === i)).filter(Boolean);
    const cover = c => { const p = P.find(x => x.id === COVER[c]) || P.find(x => x.category === c && x.image) || P.find(x => x.category === c); return p ? imgOf(p) : PH; };
    let hero = byId(HERO); if (hero.length < 2) hero = P.filter(p => p.image).slice(0, 4);
    let feat = P.filter(p => /popular|featured|best|new/i.test(p.badge || "")).slice(0, 8); if (!feat.length) feat = byId(FEATURED);
    if (!feat.length) feat = P.slice(0, 8);
    const map = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.ADDRESS);
    document.getElementById("page").innerHTML = `
    <section class="hero"><div class="wrap">
      <div>
        <h1>LED lights for trucks, tractors and commercial vehicles</h1>
        <p>Tail lamps, indicators, roof lights, halogen and football lights by ARA Lite and SAB Lite. Find your part, then call or WhatsApp us for price and stock.</p>
        <form class="hero-search" action="products.html"><input name="q" type="search" placeholder="Search by name or code, e.g. ATL-61, Scania, roof lamp" aria-label="Search products"><button>Search</button></form>
        <div class="btn-row"><a class="solid" href="products.html">Browse all ${P.length} products</a><a class="outline" href="${wa()}" target="_blank" rel="noopener">WhatsApp us</a></div>
      </div>
      <div class="collage">${hero.map(p => `<a href="${prodUrl(p)}" aria-label="${esc(p.name)}"><img src="${esc(imgOf(p))}" alt="${esc(p.name)}"></a>`).join("")}</div>
    </div></section>
    <section class="facts"><div class="wrap">
      <div class="fact"><b>ARA Lite &amp; SAB Lite</b><span>Two trusted LED brands</span></div>
      <div class="fact"><b>12V &amp; 24V</b><span>Cars, trucks, tractors, buses</span></div>
      <div class="fact"><b>Made in India</b><span>Wholesale and bulk orders</span></div>
      <div class="fact"><b>Quick response</b><span>Call or WhatsApp anytime</span></div>
    </div></section>
    <div class="wrap">
      <div class="section-head"><h2>Shop by category</h2><a href="products.html">View all products</a></div>
      <div class="tiles">${cats.map(c => `<a class="tile" href="${catUrl(c)}"><img src="${esc(cover(c))}" alt="" loading="lazy"><div><b>${esc(c)}</b><span>${count[c]} products</span></div></a>`).join("")}</div>
      <div class="section-head"><h2>Popular products</h2><a href="products.html">See more</a></div>
      <div class="pgrid">${feat.map(card).join("")}</div>
      <div class="section-head"><h2>How to order</h2></div>
      <div class="steps">
        <div class="step"><i>1</i><b>Find your product</b><p>Browse by category or search by name or code.</p></div>
        <div class="step"><i>2</i><b>Call or WhatsApp us</b><p>Tap the button on any product. The message already names it.</p></div>
        <div class="step"><i>3</i><b>Confirm and receive</b><p>We confirm price, stock and dispatch for retail or bulk orders.</p></div>
      </div>
      <div class="section-head" id="contact"><h2>Contact us</h2></div>
      <div class="contact">
        <div><b>Address</b><p>${esc(C.ADDRESS)}</p><p><a href="${map}" target="_blank" rel="noopener">Open in Google Maps</a></p></div>
        <div><b>Phone</b><p><a href="${tel}">${esc(C.PHONE_DISPLAY)}</a></p><p><a href="${wa()}" target="_blank" rel="noopener">Message on WhatsApp</a></p></div>
        <div><b>Email</b><p><a href="mailto:${esc(C.EMAIL)}">${esc(C.EMAIL)}</a></p></div>
        <div><b>Hours</b><p>${esc(C.HOURS)}</p></div>
      </div>
      <div class="enquiry">
        <div><h3>Need something specific?</h3><p>Tell us the vehicle and part you are looking for and we will help.</p></div>
        <div class="btn-row"><a class="solid" href="${tel}">Call now</a><a class="outline" href="${wa()}" target="_blank" rel="noopener">WhatsApp</a></div>
      </div>
    </div>`;
  }

  /* ---------- category / all products ---------- */
  function list(P, cats, count) {
    let cat = qs.get("cat") || ""; if (cat && !cats.includes(cat)) cat = "";
    const q = (qs.get("q") || "").trim(), sort = qs.get("sort") || "", STEP = 24;
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    let items = P.filter(p => {
      if (cat && p.category !== cat) return false;
      const h = (p.name + " " + (p.description || "") + " " + (p.category || "")).toLowerCase(), n = norm(h);
      return toks.every(t => h.includes(t) || n.includes(norm(t)));
    });
    if (sort === "az") items = items.slice().sort((a, b) => a.name.localeCompare(b.name));
    const title = cat || (q ? "Search results" : "All products");
    document.title = title + " | " + C.SHOP_NAME;
    document.getElementById("page").innerHTML = `<div class="wrap">
      <nav class="crumbs"><a href="index.html">Home</a> &rsaquo; <a href="products.html">Products</a>${cat ? " &rsaquo; " + esc(cat) : ""}</nav>
      <div class="section-head"><h2>${esc(title)}</h2><span class="count">${items.length} ${items.length === 1 ? "product" : "products"}</span></div>
      <div class="layout">
        <aside class="side"><h5>CATEGORIES</h5>
          <a class="${cat ? "" : "on"}" href="products.html"><span>All products</span><small>${P.length}</small></a>
          ${cats.map(c => `<a class="${c === cat ? "on" : ""}" href="${catUrl(c)}"><span>${esc(c)}</span><small>${count[c]}</small></a>`).join("")}
        </aside>
        <div>
          <form class="bar" method="get">
            <select class="mcat" aria-label="Category" onchange="location.href=this.value">
              <option value="products.html">All products</option>${cats.map(c => `<option value="${catUrl(c)}" ${c === cat ? "selected" : ""}>${esc(c)}</option>`).join("")}
            </select>
            ${cat ? `<input type="hidden" name="cat" value="${esc(cat)}">` : ""}
            <input name="q" type="search" value="${esc(q)}" placeholder="Search in ${esc(cat || "all products")}" aria-label="Search">
            <select name="sort" aria-label="Sort" onchange="this.form.submit()"><option value="">Catalogue order</option><option value="az" ${sort === "az" ? "selected" : ""}>Name A to Z</option></select>
            <button class="solid">Search</button>
          </form>
          <div class="pgrid" id="pg"></div>
          <button class="outline more" id="more" type="button"></button>
        </div></div></div>`;
    let shown = 0; const pg = document.getElementById("pg"), more = document.getElementById("more");
    const draw = () => {
      const next = items.slice(shown, shown + STEP); shown += next.length;
      pg.insertAdjacentHTML("beforeend", next.map(card).join(""));
      more.style.display = shown < items.length ? "block" : "none";
      more.textContent = "Show more (" + (items.length - shown) + " left)";
    };
    if (!items.length) { pg.outerHTML = `<div class="empty"><p>No products found. Try another word or a product code.</p><p><a class="solid" href="${tel}">Call us for help</a></p></div>`; more.style.display = "none"; }
    else { more.onclick = draw; draw(); }
  }

  /* ---------- product page ---------- */
  function detail(P, cats) {
    const pid = document.body.dataset.id || qs.get("id"), p = P.find(x => x.id === pid), page = document.getElementById("page");
    if (!p) { page.innerHTML = `<div class="wrap"><div class="empty"><h2>Product not found</h2><p><a class="solid" href="products.html">Browse all products</a></p></div></div>`; return; }
    document.title = p.name + " | " + C.SHOP_NAME;
    const rel = P.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
    const sib = P.filter(x => x.category === p.category), at = sib.indexOf(p), prev = sib[at - 1], next = sib[at + 1];
    page.innerHTML = `<div class="wrap">
      <nav class="crumbs"><a href="index.html">Home</a> &rsaquo; <a href="products.html">Products</a> &rsaquo; <a href="${catUrl(p.category)}">${esc(p.category)}</a></nav>
      <div class="detail">
        <div class="pic"><img src="${esc(imgOf(p))}" alt="${esc(p.name)}"></div>
        <div>
          <a class="pcat" href="${catUrl(p.category)}">${esc(p.category)}</a>
          <h1>${esc(p.name)}</h1>
          ${p.description ? `<p>${esc(p.description)}</p>` : ""}
          ${p.price ? `<div class="price">${esc(p.price)}</div>` : `<p class="cat">Price on request</p>`}
          <div class="actions">
            <a class="btn call" href="${tel}">Call ${esc(C.PHONE_DISPLAY)}</a>
            <a class="btn wa" href="${wa("Hi, I'm interested in: " + p.name)}" target="_blank" rel="noopener">WhatsApp</a>
          </div>
          <p class="note">Call or WhatsApp to confirm price, stock and fitment for your vehicle. Bulk orders welcome.</p>
        </div></div>
      <div class="pn">${prev ? `<a href="${prodUrl(prev)}">&lsaquo; ${esc(prev.name)}</a>` : "<span></span>"}${next ? `<a href="${prodUrl(next)}">${esc(next.name)} &rsaquo;</a>` : ""}</div>
      ${rel.length ? `<div class="section-head"><h2>More in ${esc(p.category)}</h2><a href="${catUrl(p.category)}">View all</a></div><div class="pgrid" style="margin-bottom:56px">${rel.map(card).join("")}</div>` : ""}
    </div>`;
  }

  (async function () {
    let P = [];
    try { P = await load(); } catch (e) { P = null; }
    const cats = P ? [...new Set(P.map(p => p.category).filter(Boolean))] : [], count = {};
    if (P) cats.forEach(c => count[c] = P.filter(p => p.category === c).length);
    shell(P || [], cats, count);
    if (!P) { document.getElementById("page").innerHTML = `<div class="wrap"><div class="empty"><h2>Could not load products</h2><p>Please try again, or call us.</p><a class="solid" href="${tel}">Call now</a></div></div>`; return; }
    ({ home, products: list, product: detail })[document.body.dataset.page](P, cats, count);
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  })();
})();
