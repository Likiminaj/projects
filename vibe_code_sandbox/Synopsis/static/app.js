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

  // UI: enter loading state
  setLoading(true);
  showStatus("Fetching Reddit threads… this may take a moment.", "loading");
  document.getElementById("results-section").classList.remove("visible");

  try {
    const response = await fetch("/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Server returned a 4xx/5xx with an error message
      showStatus(data.error || "An unknown error occurred.", "error");
      return;
    }

    // Warn about any per-thread errors, but still show results
    if (data.errors && data.errors.length > 0) {
      showStatus("⚠ Some threads had errors: " + data.errors.join(" | "), "warning");
    } else {
      hideStatus();
    }

    // Render everything
    allComments = data.comments || [];
    currentPage = 1;

    renderStats(data.stats);
    renderTable();
    renderReport(data.report);
    renderQuoteBank(data.quote_bank);

    document.getElementById("results-section").classList.add("visible");

    // Scroll to results
    document.getElementById("results-section").scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    showStatus("Network error: could not reach the Flask server. Is it running?", "error");
    console.error(err);
  } finally {
    setLoading(false);
  }
}

// -------------------------------------------------------------------------
// Export button handler
// -------------------------------------------------------------------------

function handleExport() {
  // Trigger a browser download by navigating to the export endpoint
  window.location.href = "/export";
}

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
      <td class="cell-body" onclick="toggleExpand(this)">${escHtml(c.comment_body)}</td>
      <td>${c.upvotes.toLocaleString()}</td>
      <td>${escHtml(c.created_utc)}</td>
      <td>${c.sentiment_score.toFixed(3)}</td>
      <td><span class="badge badge-${c.sentiment_label}">${c.sentiment_label}</span></td>
      <td>${c.potential_redundancy ? '<span class="badge badge-flag">flagged</span>' : "—"}</td>
    `;
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

// Expand/collapse a truncated cell on click
function toggleExpand(cell) {
  cell.classList.toggle("expanded");
}

// -------------------------------------------------------------------------
// Render: Qualitative Report
// -------------------------------------------------------------------------

function renderReport(reportText) {
  document.getElementById("report-pre").textContent = reportText;
}

// -------------------------------------------------------------------------
// Render: Quote Bank
// -------------------------------------------------------------------------

function renderQuoteBank(quoteBank) {
  renderQuoteList("quotes-most-upvoted", quoteBank.most_upvoted || []);
  renderQuoteList("quotes-strong-positive", quoteBank.strong_positive || []);
  renderQuoteList("quotes-strong-negative", quoteBank.strong_negative || []);
  renderQuoteList("quotes-unmet-needs", quoteBank.unmet_needs || []);
  renderQuoteList("quotes-refusals", quoteBank.refusals || []);

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
    card.innerHTML = `
      <div class="quote-meta">
        <span class="quote-author">u/${escHtml(q.author)}</span>
        <span class="quote-subreddit">r/${escHtml(q.subreddit)}</span>
        <span class="quote-upvotes">↑ ${q.upvotes.toLocaleString()}</span>
        <span class="badge badge-${q.sentiment_label}">${q.sentiment_label} (${q.sentiment_score.toFixed(2)})</span>
      </div>
      <div class="quote-body">${escHtml(q.body)}</div>
    `;
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
// UI helpers
// -------------------------------------------------------------------------

function setLoading(on) {
  const btn = document.getElementById("process-btn");
  btn.disabled = on;
  btn.textContent = on ? "Processing…" : "Process Threads";
  document.getElementById("export-btn").disabled = on;
}

function showStatus(msg, type) {
  const bar = document.getElementById("status-bar");
  bar.className = type; // "loading" | "error" | "warning"

  if (type === "loading") {
    bar.innerHTML = `<div class="spinner"></div><span>${escHtml(msg)}</span>`;
  } else {
    bar.textContent = msg;
  }
}

function hideStatus() {
  document.getElementById("status-bar").className = "";
  document.getElementById("status-bar").innerHTML = "";
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
