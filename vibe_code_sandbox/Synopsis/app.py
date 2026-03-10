"""
app.py
------
Flask application for Synopsis — a local Reddit research synthesiser.

Routes:
  GET  /         — Serve the main UI page
  POST /process  — Accept Reddit URLs, fetch data, return JSON results
  GET  /export   — Download the last processed dataset as a CSV file
"""

import io
import os

import pandas as pd
from flask import Flask, Response, jsonify, render_template, request

from analysis.sentiment import add_sentiment_columns
from analysis.synthesizer import build_quote_bank, build_report, build_summary_stats
from analysis.thematic_coder import run_thematic_analysis
from utils.reddit_fetcher import fetch_all_threads

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)

# We store the most recently processed DataFrame here so the /export endpoint
# can serve it as a CSV without re-fetching everything.
# This is safe because the app runs locally for a single user.
_last_dataframe: pd.DataFrame = pd.DataFrame()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Serve the landing page."""
    return render_template("index.html")


@app.route("/results")
def results():
    """Serve the results page."""
    return render_template("results.html")


@app.route("/process", methods=["POST"])
def process():
    """
    Accept a JSON body with a list of Reddit URLs, fetch and analyse them,
    then return all results as JSON.

    Request body:
      { "urls": ["https://reddit.com/...", ...] }

    Response:
      {
        "comments":   [ { ... }, ... ],   ← table rows
        "stats":      { ... },            ← summary statistics
        "report":     "...",              ← qualitative synthesis text
        "quote_bank": { ... },            ← curated quotes by category
        "errors":     [ "...", ... ]      ← any per-thread errors
      }
    """
    global _last_dataframe

    # ---- Parse the request ------------------------------------------------
    body = request.get_json(silent=True)
    if not body or "urls" not in body:
        return jsonify({"error": "Request must include a 'urls' field."}), 400

    raw_urls = body["urls"]

    # Filter to non-empty strings
    urls = [u.strip() for u in raw_urls if isinstance(u, str) and u.strip()]

    if not urls:
        return jsonify({"error": "No valid URLs provided."}), 400

    if len(urls) > 20:
        return jsonify({"error": "Please submit 20 URLs or fewer at a time."}), 400

    # ---- Fetch Reddit data ------------------------------------------------
    fetch_result = fetch_all_threads(urls)

    comments_raw = fetch_result["comments"]
    fetch_errors = fetch_result["errors"]
    fetched_count = fetch_result["fetched_count"]

    # If no comments were retrieved from any thread, return a clear error
    if not comments_raw:
        error_msg = "No comments were retrieved. "
        if fetch_errors:
            error_msg += " | ".join(fetch_errors)
        return jsonify({"error": error_msg}), 422

    # ---- Build DataFrame and run analysis ---------------------------------
    df = pd.DataFrame(comments_raw)

    # Run VADER sentiment analysis — adds three new columns
    df = add_sentiment_columns(df)

    # Persist for the /export endpoint
    _last_dataframe = df.copy()

    # ---- Build output structures ------------------------------------------
    stats = build_summary_stats(df, num_threads=fetched_count)
    quote_bank = build_quote_bank(df)
    report = build_report(df, stats, quote_bank)

    # ---- Thematic coding (Claude-powered) ---------------------------------
    theme_analysis = run_thematic_analysis(df)
    comment_themes = theme_analysis.get("comment_themes", {})

    # Convert DataFrame to a list of dicts for the JSON response.
    # We coerce types so pandas booleans / numpy types serialise cleanly.
    comments_json = df.astype({
        "upvotes": int,
        "sentiment_score": float,
        "potential_redundancy": bool,
    }).to_dict(orient="records")

    # Attach per-comment theme data
    for comment in comments_json:
        cid = comment["comment_id"]
        coding = comment_themes.get(cid, {})
        comment["themes"] = coding.get("themes", [])
        comment["primary_theme"] = coding.get("primary_theme", None)

    return jsonify({
        "comments": comments_json,
        "stats": stats,
        "report": report,
        "quote_bank": quote_bank,
        "theme_analysis": theme_analysis,
        "errors": fetch_errors,
    })


@app.route("/export")
def export():
    """
    Stream the last processed DataFrame as a downloadable CSV file.
    If no data has been processed yet, return a 404.
    """
    if _last_dataframe.empty:
        return jsonify({"error": "No data to export. Process some threads first."}), 404

    # Write the DataFrame to an in-memory buffer
    buffer = io.StringIO()
    _last_dataframe.to_csv(buffer, index=False)
    buffer.seek(0)

    return Response(
        buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=synopsis_export.csv"},
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # debug=True gives auto-reload when you edit source files during development
    app.run(debug=True, host="127.0.0.1", port=5001)
