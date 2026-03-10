/**
 * app.js
 * ------
 * Handles both the landing page (form submission) and the results page
 * (rendering data from sessionStorage). No frameworks — plain DOM API only.
 */

"use strict";

// -------------------------------------------------------------------------
// State (results page)
// -------------------------------------------------------------------------

let allComments = [];
let currentPage = 1;
const PAGE_SIZE = 50;
let hideRedundant = false;

// -------------------------------------------------------------------------
// Page detection
// -------------------------------------------------------------------------

const IS_RESULTS = window.location.pathname === "/results";

document.addEventListener("DOMContentLoaded", () => {
  if (IS_RESULTS) {
    initResultsPage();
  } else {
    initLandingPage();
  }
});

// -------------------------------------------------------------------------
// Landing page
// -------------------------------------------------------------------------

function initLandingPage() {
  document.getElementById("process-btn").addEventListener("click", handleProcess);
}

async function handleProcess() {
  const textarea = document.getElementById("url-input");
  const rawText = textarea.value.trim();

  if (!rawText) {
    showStatus("Please paste at least one Reddit URL.", "error");
    return;
  }

  const urls = rawText.split("\n").map((u) => u.trim()).filter(Boolean);

  if (urls.length === 0) {
    showStatus("No URLs detected. Each URL should be on its own line.", "error");
    return;
  }

  showLoadingOverlay();

  try {
    const researchQuestion = (document.getElementById("research-question")?.value || "").trim();

    const response = await fetch("/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls, research_question: researchQuestion || undefined }),
    });

    const data = await response.json();

    if (!response.ok) {
      hideLoadingOverlay();
      showStatus(data.error || "An unknown error occurred.", "error");
      return;
    }

    // Store results for the results page and navigate
    sessionStorage.setItem("synopsis_results", JSON.stringify(data));
    window.location.href = "/results";

  } catch (err) {
    hideLoadingOverlay();
    showStatus("Network error: could not reach the Flask server. Is it running?", "error");
    console.error(err);
  }
}

// -------------------------------------------------------------------------
// Results page
// -------------------------------------------------------------------------

function initResultsPage() {
  const raw = sessionStorage.getItem("synopsis_results");

  if (!raw) {
    document.getElementById("no-data-msg").style.display = "block";
    document.getElementById("stats-card").style.display = "none";
    return;
  }

  const data = JSON.parse(raw);

  allComments = data.comments || [];
  currentPage = 1;

  renderStats(data.stats);
  renderTable();
  renderQuoteBank(data.quote_bank);
  renderThemeAnalysis(data.theme_analysis);

  if (data.errors && data.errors.length > 0) {
    // Surface any per-thread errors as a banner
    const banner = document.createElement("div");
    banner.className = "error-banner";
    banner.textContent = "Some threads had errors: " + data.errors.join(" | ");
    document.querySelector("main").prepend(banner);
  }

  // New analysis — warn before leaving
  const newAnalysisLink = document.getElementById("new-analysis-link");
  const modal           = document.getElementById("new-analysis-modal");
  const modalCancel     = document.getElementById("modal-cancel");
  const modalConfirm    = document.getElementById("modal-confirm");

  newAnalysisLink.addEventListener("click", (e) => {
    e.preventDefault();
    modal.classList.add("open");
  });
  modalCancel.addEventListener("click", () => modal.classList.remove("open"));
  modalConfirm.addEventListener("click", () => { window.location.href = "/"; });
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Hide-redundant toggle
  document.getElementById("hide-redundant").addEventListener("change", (e) => {
    hideRedundant = e.target.checked;
    currentPage = 1;
    renderTable();
  });
}

// -------------------------------------------------------------------------
// Export
// -------------------------------------------------------------------------

function handleExport() {
  window.location.href = "/export";
}
window.handleExport = handleExport;

// -------------------------------------------------------------------------
// Render: Summary Statistics
// -------------------------------------------------------------------------

function renderStats(stats) {
  const total = stats.total_comments || 0;

  setText("stat-threads", stats.total_threads);
  setText("stat-comments", total.toLocaleString());
  setText("stat-avg-sentiment", (stats.average_sentiment >= 0 ? "+" : "") + stats.average_sentiment.toFixed(3));
  setText("stat-positive", stats.positive_comments.toLocaleString());
  setText("stat-neutral", stats.neutral_comments.toLocaleString());
  setText("stat-negative", stats.negative_comments.toLocaleString());

  if (total > 0) {
    const posW = ((stats.positive_comments / total) * 100).toFixed(1);
    const neuW = ((stats.neutral_comments  / total) * 100).toFixed(1);
    const negW = ((stats.negative_comments / total) * 100).toFixed(1);
    document.querySelector(".seg-pos").style.width = posW + "%";
    document.querySelector(".seg-neu").style.width = neuW + "%";
    document.querySelector(".seg-neg").style.width = negW + "%";
  }
}

// -------------------------------------------------------------------------
// Render: Comment Table
// -------------------------------------------------------------------------

function renderTable() {
  const tbody = document.getElementById("comment-tbody");
  tbody.innerHTML = "";

  const filtered = hideRedundant
    ? allComments.filter((c) => !c.potential_redundancy)
    : allComments;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageComments = filtered.slice(start, start + PAGE_SIZE);

  pageComments.forEach((c) => {
    const tr = document.createElement("tr");
    if (c.potential_redundancy) tr.classList.add("redundant");

    tr.innerHTML = `
      <td class="cell-thread">${escHtml(c.thread_title)}</td>
      <td>r/${escHtml(c.subreddit)}</td>
      <td><a class="thread-link" href="${escHtml(c.thread_url)}" target="_blank" rel="noopener">link ↗</a></td>
      <td>${escHtml(c.author)}</td>
      <td class="cell-body-full"></td>
      <td>${c.upvotes.toLocaleString()}</td>
      <td>${escHtml(c.created_utc)}</td>
      <td>${c.sentiment_score.toFixed(3)}</td>
      <td><span class="badge badge-${c.sentiment_label}">${c.sentiment_label}</span></td>
      <td>${c.potential_redundancy ? '<span class="badge badge-flag">flagged</span>' : "—"}</td>
    `;
    buildAccordion(tr.querySelector(".cell-body-full"), c.comment_body);
    tbody.appendChild(tr);
  });

  renderPagination(totalPages, filtered.length);

  const label = hideRedundant
    ? `Showing ${filtered.length.toLocaleString()} of ${allComments.length.toLocaleString()} comments (redundant hidden)`
    : `Showing all ${allComments.length.toLocaleString()} comments`;
  setText("comment-count-label", label);
}

function renderPagination(totalPages, totalFiltered) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  if (totalPages <= 1) return;

  container.appendChild(makePageBtn("← Prev", currentPage > 1, () => { currentPage--; renderTable(); }));

  buildPageRange(currentPage, totalPages).forEach((p) => {
    if (p === "…") {
      const span = document.createElement("span");
      span.textContent = "…";
      span.className = "page-info";
      container.appendChild(span);
    } else {
      const btn = makePageBtn(String(p), true, () => { currentPage = p; renderTable(); });
      if (p === currentPage) btn.classList.add("active");
      container.appendChild(btn);
    }
  });

  container.appendChild(makePageBtn("Next →", currentPage < totalPages, () => { currentPage++; renderTable(); }));

  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = `Page ${currentPage} of ${totalPages} (${totalFiltered.toLocaleString()} comments)`;
  container.appendChild(info);
}

function buildPageRange(current, total) {
  const range = new Set([1, total]);
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) range.add(i);
  const sorted = [...range].sort((a, b) => a - b);
  const result = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

function makePageBtn(label, enabled, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.disabled = !enabled;
  if (enabled) btn.addEventListener("click", onClick);
  return btn;
}


// -------------------------------------------------------------------------
// Accordion (comment table body)
// -------------------------------------------------------------------------

const ACCORDION_LIMIT = 240;

function buildAccordion(el, text) {
  el.textContent = "";
  if (!text || text.length <= ACCORDION_LIMIT) {
    el.textContent = text || "";
    return;
  }
  const shortSpan = document.createElement("span");
  shortSpan.className = "acc-short";
  shortSpan.textContent = text.slice(0, ACCORDION_LIMIT) + "…";

  const fullSpan = document.createElement("span");
  fullSpan.className = "acc-full";
  fullSpan.style.display = "none";
  fullSpan.textContent = text;

  const btn = document.createElement("button");
  btn.className = "acc-btn";
  btn.textContent = "Show more";
  btn.addEventListener("click", () => {
    const hidden = fullSpan.style.display === "none";
    fullSpan.style.display  = hidden ? "block" : "none";
    shortSpan.style.display = hidden ? "none"  : "block";
    btn.textContent = hidden ? "Show less" : "Show more";
  });

  el.appendChild(shortSpan);
  el.appendChild(fullSpan);
  el.appendChild(btn);
}

// -------------------------------------------------------------------------
// Render: Quote Bank
// -------------------------------------------------------------------------

function renderQuoteBank(quoteBank) {
  renderQuoteList("quotes-most-upvoted",   quoteBank.most_upvoted    || []);
  renderQuoteList("quotes-strong-positive", quoteBank.strong_positive || []);
  renderQuoteList("quotes-strong-negative", quoteBank.strong_negative || []);
  switchTab("most_upvoted");
}

function renderQuoteList(containerId, quotes) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (quotes.length === 0) {
    container.innerHTML = '<p class="empty-state">No quotes found for this category.</p>';
    return;
  }

  quotes.forEach((q) => {
    const card = document.createElement("div");
    card.className = "quote-card";

    const meta = document.createElement("div");
    meta.className = "quote-meta";
    meta.innerHTML = `
      <span class="quote-author">u/${escHtml(q.author)}</span>
      <span class="quote-subreddit">r/${escHtml(q.subreddit)}</span>
      <span class="quote-upvotes">↑ ${q.upvotes.toLocaleString()}</span>
      <span class="badge badge-${q.sentiment_label}">${q.sentiment_label} (${q.sentiment_score.toFixed(2)})</span>
    `;

    const body = document.createElement("div");
    body.className = "quote-body";
    buildAccordion(body, q.body);

    card.appendChild(meta);
    card.appendChild(body);
    container.appendChild(card);
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === "tab-" + tabId);
  });
}

// -------------------------------------------------------------------------
// Render: Theme badges
// -------------------------------------------------------------------------

function renderThemeBadges(themes) {
  if (!themes || themes.length === 0) return '<span style="color:var(--text-muted)">—</span>';
  return themes.map((t) => `<span class="badge badge-theme">${escHtml(t)}</span>`).join(" ");
}

// -------------------------------------------------------------------------
// Render: Theme Analysis card
// -------------------------------------------------------------------------

function renderThemeAnalysis(themeAnalysis) {
  const card   = document.getElementById("theme-analysis-card");
  const grid   = document.getElementById("theme-grid");
  const status = document.getElementById("theme-analysis-status");
  grid.innerHTML = "";

  if (!themeAnalysis || !themeAnalysis.dataset_themes || themeAnalysis.dataset_themes.length === 0) {
    card.style.display = "none";
    return;
  }

  const themes = themeAnalysis.dataset_themes;
  status.textContent = `${themes.length} theme${themes.length !== 1 ? "s" : ""} identified across the dataset.`;
  card.style.display = "block";

  themes.forEach((t) => {
    const el = document.createElement("div");
    el.className = "theme-card";

    const signalClass = { strong: "badge-positive", moderate: "badge-neutral", emerging: "badge-flag" }[t.signal_strength] || "badge-neutral";
    const examples = (t.representative_examples || []).map((ex) => `<li>"${escHtml(ex)}"</li>`).join("");
    const related  = (t.related_themes || []).map((r) => `<span class="badge badge-theme">${escHtml(r)}</span>`).join(" ");

    el.innerHTML = `
      <div class="theme-card-header">
        <span class="theme-label">${escHtml(t.theme_label)}</span>
        <span class="badge ${signalClass}">${escHtml(t.signal_strength)}</span>
        <span class="theme-prevalence">${escHtml(t.prevalence)}</span>
      </div>
      <p class="theme-definition">${escHtml(t.theme_definition)}</p>
      ${examples ? `<ul class="theme-examples">${examples}</ul>` : ""}
      <div class="theme-meta">
        <div class="theme-meta-row"><strong>Research takeaway:</strong><span>${escHtml(t.research_takeaway)}</span></div>
        <div class="theme-meta-row"><strong>Product implication:</strong><span>${escHtml(t.product_implication)}</span></div>
        ${related ? `<div class="theme-meta-row"><strong>Related themes:</strong> ${related}</div>` : ""}
      </div>
    `;
    grid.appendChild(el);
  });
}

// -------------------------------------------------------------------------
// Loading overlay (landing page only)
// -------------------------------------------------------------------------

const LOADING_STEPS = [
  "Fetching Reddit threads",
  "Running sentiment analysis",
  "Coding themes with AI",
  "Building synthesis report",
];
let _stepTimers = [];

function showLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  LOADING_STEPS.forEach((_, i) => {
    const el = document.getElementById("step-" + i);
    if (el) el.className = "step";
  });
  _stepTimers.forEach(clearTimeout);
  _stepTimers = [];
  overlay.classList.add("active");
  document.getElementById("process-btn").disabled = true;

  const delays = [100, 3500, 7000, 18000];
  delays.forEach((delay, i) => {
    _stepTimers.push(setTimeout(() => activateStep(i), delay));
  });
}

function activateStep(index) {
  if (index > 0) {
    const prev = document.getElementById("step-" + (index - 1));
    if (prev) prev.className = "step done";
  }
  const el = document.getElementById("step-" + index);
  if (el) el.className = "step active";
}

function hideLoadingOverlay() {
  _stepTimers.forEach(clearTimeout);
  _stepTimers = [];
  LOADING_STEPS.forEach((_, i) => {
    const el = document.getElementById("step-" + i);
    if (el) el.className = "step done";
  });
  setTimeout(() => {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.classList.remove("active");
    const btn = document.getElementById("process-btn");
    if (btn) btn.disabled = false;
  }, 400);
}

// -------------------------------------------------------------------------
// Status bar (landing page)
// -------------------------------------------------------------------------

function showStatus(msg, type) {
  const bar = document.getElementById("status-bar");
  if (!bar) return;
  bar.className = type;
  bar.textContent = msg;
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
