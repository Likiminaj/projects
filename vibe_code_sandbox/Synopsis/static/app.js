/**
 * app.js
 * ------
 * Minimal JavaScript for Synopsis.
 * Handles form submission, result rendering, pagination, tabs, and CSV export.
 * No frameworks — plain DOM API only.
 */

"use strict";

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------

// All fetched comments (used for pagination and filtering)
let allComments = [];
let currentPage = 1;
const PAGE_SIZE = 50;

// Whether to hide flagged redundant comments in the table
let hideRedundant = false;

// -------------------------------------------------------------------------
// Entry point — runs when the page has loaded
// -------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("process-btn").addEventListener("click", handleProcess);
  document.getElementById("export-btn").addEventListener("click", handleExport);
  document.getElementById("hide-redundant").addEventListener("change", (e) => {
    hideRedundant = e.target.checked;
    currentPage = 1;
    renderTable();
  });

  // Tab switching for quote bank
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Delegated click for all accordion buttons (table + quote bank)
  document.getElementById("results-section").addEventListener("click", (e) => {
    const btn = e.target.closest(".acc-btn");
    if (!btn) return;
    const container = btn.parentElement;
    const short = container.querySelector(".acc-short");
    const full  = container.querySelector(".acc-full");
    if (!short || !full) return;
    const isHidden = full.style.display === "none";
    full.style.display  = isHidden ? "block" : "none";
    short.style.display = isHidden ? "none"  : "block";
    btn.textContent = isHidden ? "Show less" : "Show more";
  });
});

// -------------------------------------------------------------------------
// Process button handler
// -------------------------------------------------------------------------

async function handleProcess() {
  const textarea = document.getElementById("url-input");
  const rawText = textarea.value.trim();

  if (!rawText) {
    showStatus("Please paste at least one Reddit URL.", "error");
    return;
  }

  // Split by newlines, filter blank lines
  const urls = rawText
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    showStatus("No URLs detected. Each URL should be on its own line.", "error");
    return;
  }

  document.getElementById("results-section").classList.remove("visible");
  showLoadingOverlay();

  try {
    const response = await fetch("/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    const data = await response.json();

    if (!response.ok) {
      hideLoadingOverlay();
      showStatus(data.error || "An unknown error occurred.", "error");
      return;
    }

    // Render everything
    allComments = data.comments || [];
    currentPage = 1;

    renderStats(data.stats);
    renderTable();
    renderQuoteBank(data.quote_bank);
    renderThemeAnalysis(data.theme_analysis);

    hideLoadingOverlay();

    // Warn about any per-thread errors after overlay is gone
    if (data.errors && data.errors.length > 0) {
      showStatus("Some threads had errors: " + data.errors.join(" | "), "warning");
    } else {
      hideStatus();
    }

    document.getElementById("results-section").classList.add("visible");
    document.getElementById("results-section").scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    hideLoadingOverlay();
    showStatus("Network error: could not reach the Flask server. Is it running?", "error");
    console.error(err);
  }
}

// -------------------------------------------------------------------------
// Export button handler
// -------------------------------------------------------------------------

function handleExport() {
  // Trigger a browser download by navigating to the export endpoint
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

  // Update sentiment distribution bar
  if (total > 0) {
    const posW = ((stats.positive_comments / total) * 100).toFixed(1);
    const neuW = ((stats.neutral_comments / total) * 100).toFixed(1);
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

  // Filter comments based on checkbox state
  const filtered = hideRedundant
    ? allComments.filter((c) => !c.potential_redundancy)
    : allComments;

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageComments = filtered.slice(start, start + PAGE_SIZE);

  // Render rows
  pageComments.forEach((c) => {
    const tr = document.createElement("tr");
    if (c.potential_redundancy) tr.classList.add("redundant");

    tr.innerHTML = `
      <td class="cell-body" onclick="toggleExpand(this)">${escHtml(c.thread_title)}</td>
      <td>r/${escHtml(c.subreddit)}</td>
      <td><a class="thread-link" href="${escHtml(c.thread_url)}" target="_blank" rel="noopener">link ↗</a></td>
      <td><code>${escHtml(c.comment_id)}</code></td>
      <td><code>${escHtml(String(c.parent_id))}</code></td>
      <td>${escHtml(c.author)}</td>
      <td class="cell-accordion"></td>
      <td>${c.upvotes.toLocaleString()}</td>
      <td>${escHtml(c.created_utc)}</td>
      <td>${c.sentiment_score.toFixed(3)}</td>
      <td><span class="badge badge-${c.sentiment_label}">${c.sentiment_label}</span></td>
      <td>${c.potential_redundancy ? '<span class="badge badge-flag">flagged</span>' : "—"}</td>
      <td class="cell-themes">${renderThemeBadges(c.themes || [])}</td>
    `;
    buildAccordion(tr.querySelector(".cell-accordion"), c.comment_body);
    tbody.appendChild(tr);
  });

  // Update pagination controls
  renderPagination(totalPages, filtered.length);

  // Update comment count label
  const label = hideRedundant
    ? `Showing ${filtered.length.toLocaleString()} of ${allComments.length.toLocaleString()} comments (redundant hidden)`
    : `Showing all ${allComments.length.toLocaleString()} comments`;
  setText("comment-count-label", label);
}

function renderPagination(totalPages, totalFiltered) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  const prev = makePageBtn("← Prev", currentPage > 1, () => {
    currentPage--;
    renderTable();
  });
  container.appendChild(prev);

  // Page number buttons (show up to 7 at a time with ellipsis)
  const pageNums = buildPageRange(currentPage, totalPages);
  pageNums.forEach((p) => {
    if (p === "…") {
      const span = document.createElement("span");
      span.textContent = "…";
      span.className = "page-info";
      container.appendChild(span);
    } else {
      const btn = makePageBtn(String(p), true, () => {
        currentPage = p;
        renderTable();
      });
      if (p === currentPage) btn.classList.add("active");
      container.appendChild(btn);
    }
  });

  const next = makePageBtn("Next →", currentPage < totalPages, () => {
    currentPage++;
    renderTable();
  });
  container.appendChild(next);

  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = `Page ${currentPage} of ${totalPages} (${totalFiltered.toLocaleString()} comments)`;
  container.appendChild(info);
}

function buildPageRange(current, total) {
  // Always show first, last, and a window around current
  const range = new Set([1, total]);
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    range.add(i);
  }
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

// Expand/collapse a truncated cell on click (used for thread title)
function toggleExpand(cell) {
  cell.classList.toggle("expanded");
}

// -------------------------------------------------------------------------
// Accordion: comment body
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
  shortSpan.style.display = "block";
  shortSpan.textContent = text.slice(0, ACCORDION_LIMIT) + "…";

  const fullSpan = document.createElement("span");
  fullSpan.className = "acc-full";
  fullSpan.style.display = "none";
  fullSpan.textContent = text;

  const btn = document.createElement("button");
  btn.className = "acc-btn";
  btn.textContent = "Show more";

  el.appendChild(shortSpan);
  el.appendChild(fullSpan);
  el.appendChild(btn);
}


// -------------------------------------------------------------------------
// Render: Qualitative Report
// -------------------------------------------------------------------------

function _removedRenderReport(reportText) {
  const el = document.getElementById("report-pre");

  if (!reportText || reportText === "No data available to synthesise.") {
    el.innerHTML = `<p class="report-empty">Report will appear here after processing.</p>`;
    return;
  }

  const lines = reportText.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t || /^[=\-]{6,}$/.test(t)) continue;

    // Report title — skip (redundant with page header)
    if (t.startsWith("SYNOPSIS") && t.includes("REPORT")) continue;

    // Generated date
    if (t.startsWith("Generated:")) {
      sections.push({ type: "meta", text: t });
      continue;
    }

    // Section header: all-caps words, no numbers, length ≤ 40
    if (/^[A-Z][A-Z\s\/]{3,39}$/.test(t)) {
      current = { type: "section", header: t, lines: [] };
      sections.push(current);
      continue;
    }

    // Content line
    if (current) current.lines.push(t);
    else sections.push({ type: "line", text: t });
  }

  let html = "";
  for (const sec of sections) {
    if (sec.type === "meta") {
      html += `<p class="report-meta">${escHtml(sec.text)}</p>`;
    } else if (sec.type === "section") {
      html += `<div class="report-section">`;
      html += `<h4 class="report-sh">${escHtml(sec.header)}</h4>`;
      for (const ln of sec.lines) {
        // Lines that are key : value pairs
        if (ln.includes(" : ")) {
          const [k, ...vParts] = ln.split(" : ");
          html += `<div class="report-kv"><span class="report-k">${escHtml(k.trim())}</span><span class="report-v">${escHtml(vParts.join(" : ").trim())}</span></div>`;
        } else if (ln.startsWith('"')) {
          html += `<blockquote class="report-quote">${escHtml(ln)}</blockquote>`;
        } else if (ln.startsWith("—")) {
          html += `<p class="report-attribution">${escHtml(ln)}</p>`;
        } else {
          html += `<p class="report-p">${escHtml(ln)}</p>`;
        }
      }
      html += `</div>`;
    } else if (sec.type === "line") {
      html += `<p class="report-p">${escHtml(sec.text)}</p>`;
    }
  }

  el.innerHTML = html;
}

// -------------------------------------------------------------------------
// Render: Quote Bank
// -------------------------------------------------------------------------

function renderQuoteBank(quoteBank) {
  renderQuoteList("quotes-most-upvoted", quoteBank.most_upvoted || []);
  renderQuoteList("quotes-strong-positive", quoteBank.strong_positive || []);
  renderQuoteList("quotes-strong-negative", quoteBank.strong_negative || []);

  // Activate first tab
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

    // Meta row
    const meta = document.createElement("div");
    meta.className = "quote-meta";
    meta.innerHTML = `
      <span class="quote-author">u/${escHtml(q.author)}</span>
      <span class="quote-subreddit">r/${escHtml(q.subreddit)}</span>
      <span class="quote-upvotes">↑ ${q.upvotes.toLocaleString()}</span>
      <span class="badge badge-${q.sentiment_label}">${q.sentiment_label} (${q.sentiment_score.toFixed(2)})</span>
    `;

    // Body with accordion
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
// Render: Theme badges (used in table rows)
// -------------------------------------------------------------------------

function renderThemeBadges(themes) {
  if (!themes || themes.length === 0) return '<span style="color:var(--text-muted)">—</span>';
  return themes
    .map((t) => `<span class="badge badge-theme">${escHtml(t)}</span>`)
    .join(" ");
}

// -------------------------------------------------------------------------
// Render: Theme Analysis card
// -------------------------------------------------------------------------

function renderThemeAnalysis(themeAnalysis) {
  const card = document.getElementById("theme-analysis-card");
  const grid = document.getElementById("theme-grid");
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

    const signalClass = {
      strong: "badge-positive",
      moderate: "badge-neutral",
      emerging: "badge-flag",
    }[t.signal_strength] || "badge-neutral";

    const examples = (t.representative_examples || [])
      .map((ex) => `<li>"${escHtml(ex)}"</li>`)
      .join("");

    const related = (t.related_themes || [])
      .map((r) => `<span class="badge badge-theme">${escHtml(r)}</span>`)
      .join(" ");

    el.innerHTML = `
      <div class="theme-card-header">
        <span class="theme-label">${escHtml(t.theme_label)}</span>
        <span class="badge ${signalClass}">${escHtml(t.signal_strength)}</span>
        <span class="theme-prevalence">${escHtml(t.prevalence)}</span>
      </div>
      <p class="theme-definition">${escHtml(t.theme_definition)}</p>
      ${examples ? `<ul class="theme-examples">${examples}</ul>` : ""}
      <div class="theme-meta">
        <div class="theme-meta-row">
          <strong>Research takeaway:</strong>
          <span>${escHtml(t.research_takeaway)}</span>
        </div>
        <div class="theme-meta-row">
          <strong>Product implication:</strong>
          <span>${escHtml(t.product_implication)}</span>
        </div>
        ${related ? `<div class="theme-meta-row"><strong>Related themes:</strong> ${related}</div>` : ""}
      </div>
    `;
    grid.appendChild(el);
  });
}

// -------------------------------------------------------------------------
// UI helpers
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// Loading overlay
// -------------------------------------------------------------------------

const LOADING_STEPS = [
  "Fetching Reddit threads",
  "Running sentiment analysis",
  "Coding themes with AI",
  "Building synthesis report",
];
let _stepTimers = [];
let _currentStep = -1;

function showLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  // Reset all steps
  LOADING_STEPS.forEach((_, i) => {
    const el = document.getElementById("step-" + i);
    if (el) el.className = "step";
  });
  _currentStep = -1;
  _stepTimers.forEach(clearTimeout);
  _stepTimers = [];

  overlay.classList.add("active");
  document.getElementById("process-btn").disabled = true;
  document.getElementById("export-btn").disabled = true;

  // Animate through steps with staggered delays
  // Step 0 immediately, then roughly every 4-8s (most time is thematic analysis)
  const delays = [100, 3500, 7000, 18000];
  delays.forEach((delay, i) => {
    _stepTimers.push(setTimeout(() => activateStep(i), delay));
  });
}

function activateStep(index) {
  // Mark previous as done
  if (index > 0) {
    const prev = document.getElementById("step-" + (index - 1));
    if (prev) prev.className = "step done";
  }
  const el = document.getElementById("step-" + index);
  if (el) el.className = "step active";
  _currentStep = index;
}

function hideLoadingOverlay() {
  _stepTimers.forEach(clearTimeout);
  _stepTimers = [];

  // Flash all steps as done briefly before hiding
  LOADING_STEPS.forEach((_, i) => {
    const el = document.getElementById("step-" + i);
    if (el) el.className = "step done";
  });

  setTimeout(() => {
    document.getElementById("loading-overlay").classList.remove("active");
    document.getElementById("process-btn").disabled = false;
    document.getElementById("export-btn").disabled = false;
  }, 400);
}

function showStatus(msg, type) {
  const bar = document.getElementById("status-bar");
  bar.className = type;
  bar.textContent = msg;
}

function hideStatus() {
  const bar = document.getElementById("status-bar");
  bar.className = "";
  bar.textContent = "";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Escape HTML special chars to prevent XSS from Reddit comment content
function escHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
