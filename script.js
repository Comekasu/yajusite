(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };

  const header = $("#siteHeader");
  const burger = $("#burger");
  const nav = $("#nav");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a")) : [];
  const yearEl = $("#year");
  const terminalEl = $("#terminalText");
  const toastEl = $("#toast");

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 20);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setNav(open) {
    if (!burger || !nav) return;
    burger.classList.toggle("is-open", open);
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setNav(false);
    });
  }

  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealEls.forEach(function (el, index) {
      el.style.transitionDelay = (index % 3) * 60 + "ms";
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  let toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-show");
    }, 2200);
  }

  const terminalLines = [
    "$ whoami",
    "> 野獣先輩",
    "$ age",
    "> 24",
    "$ job",
    "> 学生",
    "$ status",
    "> やりますねぇ"
  ];

  if (terminalEl) {
    const fullText = terminalLines.join("\n");
    if (reduceMotion) {
      terminalEl.textContent = fullText;
    } else {
      let i = 0;
      const type = function () {
        if (i >= fullText.length) return;
        const ch = fullText.charAt(i);
        terminalEl.textContent += ch;
        i += 1;
        const delay = ch === "\n" ? 260 : 32;
        window.setTimeout(type, delay);
      };
      window.setTimeout(type, 500);
    }
  }

  function readNumber(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      const value = Number(raw);
      return Number.isFinite(value) && value > 0 ? value : fallback;
    } catch (err) {
      void err;
      return fallback;
    }
  }

  function writeValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      void err;
    }
  }

  const VISIT_KEY = "yajuu.visits.v1";
  const SESSION_KEY = "yajuu.visited";
  let visits = readNumber(VISIT_KEY, 114514);
  if (visits < 114514) visits = 114514;

  let alreadyCounted = false;
  try {
    alreadyCounted = window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch (err) {
    void err;
  }

  if (!alreadyCounted) {
    visits += 1;
    writeValue(VISIT_KEY, String(visits));
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch (err) {
      void err;
    }
  }

  const countEl = $("#visitorCount");
  const noteEl = $("#visitorNote");

  function formatNumber(value) {
    return value.toLocaleString("ja-JP");
  }

  function animateCount(target) {
    if (!countEl) return;
    if (reduceMotion) {
      countEl.textContent = formatNumber(target);
      return;
    }
    const start = Math.max(0, target - 48);
    const duration = 1200;
    const started = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      countEl.textContent = formatNumber(current);
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  animateCount(visits);
  if (noteEl) {
    noteEl.textContent = "あなたは " + formatNumber(visits) + " 人目の訪問者です";
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest(".copy");
    if (!btn) return;
    const text = btn.dataset.quote || "";
    if (!text) return;

    const done = function () {
      const original = btn.textContent;
      btn.textContent = "COPIED";
      showToast("コピーしました：「" + text + "」");
      window.setTimeout(function () {
        btn.textContent = original;
      }, 1400);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  });

  function fallbackCopy(text, done) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      void err;
    }
    document.body.removeChild(area);
    if (ok) done();
    else showToast("コピーできませんでした。手動で選択してください。");
  }

  const BBS_KEY = "yajuu.bbs.v1";
  const postsEl = $("#bbsPosts");
  const threadCountEl = $("#threadCount");
  const bbsForm = $("#bbsForm");
  const nameInput = $("#bbsName");
  const textInput = $("#bbsText");
  const countText = $("#bbsCount");

  const seedPosts = [
    {
      name: "名無しの観測者",
      text: "初見です。24歳、学生という情報量の多さに草。",
      date: "2026/10/20 21:14"
    },
    {
      name: "迫真好き",
      text: "「やりますねぇ」の抑揚、何度聞いても癖になります。",
      date: "2026/10/22 09:03"
    },
    {
      name: "通りすがり",
      text: "非公式アーカイブ、丁寧にまとまっていて助かります。",
      date: "2026/10/24 18:40"
    }
  ];

  let posts = seedPosts.slice();

  try {
    const raw = window.localStorage.getItem(BBS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length) {
        posts = saved.filter(function (p) {
          return p && typeof p.name === "string" && typeof p.text === "string";
        });
      }
    }
  } catch (err) {
    void err;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function nowStamp() {
    const d = new Date();
    const pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };
    return (
      d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes())
    );
  }

  function persistPosts() {
    try {
      window.localStorage.setItem(BBS_KEY, JSON.stringify(posts));
    } catch (err) {
      void err;
    }
  }

  function renderPosts() {
    if (!postsEl) return;
    const total = posts.length;

    postsEl.innerHTML = posts.map(function (post, index) {
      const no = total - index;
      return (
        '<article class="post">' +
        '<div class="post__head">' +
        '<span class="post__no">#' + no + "</span>" +
        '<span class="post__name">' + escapeHtml(post.name) + "</span>" +
        '<span class="post__date">' + escapeHtml(post.date) + "</span>" +
        "</div>" +
        '<p class="post__text">' + escapeHtml(post.text) + "</p>" +
        "</article>"
      );
    }).join("");

    if (threadCountEl) threadCountEl.textContent = String(total);
  }

  function updateCharCount() {
    if (!textInput || !countText) return;
    countText.textContent = textInput.value.length + " / 240";
  }

  renderPosts();
  updateCharCount();

  if (textInput) {
    textInput.addEventListener("input", updateCharCount);
  }

  if (bbsForm) {
    bbsForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const text = textInput.value.trim();
      if (!text) {
        showToast("本文を入力してください。");
        textInput.focus();
        return;
      }

      const name = (nameInput.value.trim() || "名無しの観測者").slice(0, 24);
      posts.unshift({ name: name, text: text, date: nowStamp() });
      persistPosts();
      renderPosts();
      textInput.value = "";
      updateCharCount();
      showToast("書き込みました。");
      textInput.focus();
    });
  }
})();
