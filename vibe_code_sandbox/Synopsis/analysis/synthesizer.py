"""
synthesizer.py
--------------
Turns the enriched comments DataFrame into three research outputs:

  1. summary_stats  — key numbers about the dataset
  2. report         — a qualitative written synthesis (plain text)
  3. quote_bank     — curated quotes grouped by category
"""

import re
from collections import Counter
from datetime import date

import pandas as pd


# ---------------------------------------------------------------------------
# Stopwords — common English words we exclude when finding themes
# ---------------------------------------------------------------------------
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "its", "as", "be", "was",
    "are", "were", "been", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "shall", "can",
    "not", "no", "so", "if", "then", "than", "that", "this", "these",
    "those", "which", "who", "what", "how", "when", "where", "why",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they",
    "his", "her", "their", "him", "us", "just", "like", "get", "got",
    "also", "very", "really", "much", "more", "some", "any", "all",
    "one", "two", "out", "up", "about", "there", "here", "been", "im",
    "dont", "cant", "isnt", "wasnt", "ive", "id", "youre", "theyre",
    "its", "reddit", "comment", "post", "thread", "subreddit", "edit",
    "deleted", "removed", "op", "oc", "tldr", "tl", "dr", "re", "http",
    "https", "www", "com", "even", "still", "make", "made", "go", "going",
    "think", "know", "see", "use", "used", "new", "now", "time", "way",
    "people", "thing", "things", "look", "want", "need", "say", "said",
    "good", "bad", "great", "same", "other", "well", "back", "come",
}

REFUSAL_PATTERNS = []
REFUSAL_RE = [re.compile(p, re.IGNORECASE) for p in REFUSAL_PATTERNS]

# How many comments to include in each quote bank category
QUOTE_BANK_SIZE = 10


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _matches_any(text: str, patterns: list) -> bool:
    """Return True if text matches at least one compiled regex pattern."""
    return any(p.search(text) for p in patterns)


def _top_keywords(df: pd.DataFrame, n: int = 10) -> list:
    """
    Find the most common meaningful words across all comment bodies.

    Filters out stopwords and very short tokens to surface actual themes.
    """
    word_counts: Counter = Counter()

    for body in df["comment_body"].dropna():
        # Tokenise: lower-case, split on non-alpha characters
        tokens = re.findall(r"[a-z]{4,}", body.lower())
        meaningful = [t for t in tokens if t not in STOPWORDS]
        word_counts.update(meaningful)

    return [word for word, _ in word_counts.most_common(n)]


def _format_quote(row: pd.Series) -> dict:
    """Package a DataFrame row as a quote dict for the quote bank."""
    return {
        "author": row["author"],
        "subreddit": row["subreddit"],
        "upvotes": int(row["upvotes"]),
        "sentiment_score": float(row["sentiment_score"]),
        "sentiment_label": row["sentiment_label"],
        "body": row["comment_body"],
        "thread_title": row["thread_title"],
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_summary_stats(df: pd.DataFrame, num_threads: int) -> dict:
    """
    Compute high-level summary statistics from the enriched DataFrame.

    Returns a dict with keys matching the spec:
      total_threads, total_comments, average_sentiment,
      positive_comments, neutral_comments, negative_comments
    """
    if df.empty:
        return {
            "total_threads": num_threads,
            "total_comments": 0,
            "average_sentiment": 0.0,
            "positive_comments": 0,
            "neutral_comments": 0,
            "negative_comments": 0,
        }

    label_counts = df["sentiment_label"].value_counts()

    return {
        "total_threads": num_threads,
        "total_comments": len(df),
        "average_sentiment": round(float(df["sentiment_score"].mean()), 4),
        "positive_comments": int(label_counts.get("positive", 0)),
        "neutral_comments": int(label_counts.get("neutral", 0)),
        "negative_comments": int(label_counts.get("negative", 0)),
    }


def build_quote_bank(df: pd.DataFrame) -> dict:
    """
    Extract curated quotes from the DataFrame grouped into five categories.

    Categories:
      most_upvoted        — highest upvote count
      strong_positive     — highest positive sentiment scores
      strong_negative     — lowest (most negative) sentiment scores
    """
    if df.empty:
        return {
            "most_upvoted": [],
            "strong_positive": [],
            "strong_negative": [],
        }

    # Most upvoted — all comments tied at the maximum upvote count
    max_upvotes = df["upvotes"].max()
    most_upvoted = [
        _format_quote(row)
        for _, row in df[df["upvotes"] == max_upvotes].iterrows()
    ]

    # Strong positive — top QUOTE_BANK_SIZE by score among positive-labelled comments
    pos_df = df[df["sentiment_label"] == "positive"]
    strong_positive = [
        _format_quote(row)
        for _, row in pos_df.nlargest(QUOTE_BANK_SIZE, "sentiment_score").iterrows()
    ]

    # Strong negative — top QUOTE_BANK_SIZE by score among negative-labelled comments
    neg_df = df[df["sentiment_label"] == "negative"]
    strong_negative = [
        _format_quote(row)
        for _, row in neg_df.nsmallest(QUOTE_BANK_SIZE, "sentiment_score").iterrows()
    ]

    return {
        "most_upvoted": most_upvoted,
        "strong_positive": strong_positive,
        "strong_negative": strong_negative,
    }


def build_report(df: pd.DataFrame, stats: dict, quote_bank: dict) -> str:
    """
    Generate a qualitative written synthesis of the research data.

    The report is plain text (with section headers) suitable for
    display in a <pre> element or copying into a document.
    """
    if df.empty:
        return "No data available to synthesise."

    today = date.today().strftime("%B %d, %Y")
    total = stats["total_comments"]
    avg = stats["average_sentiment"]
    pos_pct = round(stats["positive_comments"] / total * 100) if total else 0
    neu_pct = round(stats["neutral_comments"] / total * 100) if total else 0
    neg_pct = round(stats["negative_comments"] / total * 100) if total else 0

    # Overall sentiment description
    if avg >= 0.05:
        sentiment_desc = "predominantly positive"
    elif avg <= -0.05:
        sentiment_desc = "predominantly negative"
    else:
        sentiment_desc = "mixed / neutral"

    # Top keywords → themes
    top_keywords = _top_keywords(df, n=12)
    themes_text = (
        ", ".join(top_keywords[:12]) if top_keywords else "insufficient data"
    )

    # Top positive quote
    top_pos = ""
    if quote_bank["strong_positive"]:
        q = quote_bank["strong_positive"][0]
        top_pos = f'  "{q["body"][:300]}…"\n  — u/{q["author"]} (+{q["upvotes"]} upvotes)'

    # Top negative quote
    top_neg = ""
    if quote_bank["strong_negative"]:
        q = quote_bank["strong_negative"][0]
        top_neg = f'  "{q["body"][:300]}…"\n  — u/{q["author"]} (+{q["upvotes"]} upvotes)'

    # Most upvoted insight
    top_upvoted = ""
    if quote_bank["most_upvoted"]:
        q = quote_bank["most_upvoted"][0]
        top_upvoted = f'  "{q["body"][:300]}…"\n  — u/{q["author"]} (+{q["upvotes"]} upvotes)'

    # Redundancy info
    redundant_count = int(df["potential_redundancy"].sum())
    redundant_pct = round(redundant_count / total * 100) if total else 0

    # Build subreddit list
    subreddits = df["subreddit"].unique().tolist()
    subreddit_list = ", ".join(f"r/{s}" for s in subreddits[:10])
    if len(subreddits) > 10:
        subreddit_list += f" and {len(subreddits) - 10} more"

    # Assemble the report
    report_lines = [
        "=" * 60,
        "  SYNOPSIS — RESEARCH SYNTHESIS REPORT",
        "=" * 60,
        f"  Generated: {today}",
        "",
        "RESEARCH OVERVIEW",
        "-" * 40,
        f"  Threads analysed : {stats['total_threads']}",
        f"  Total comments   : {total:,}",
        f"  Subreddits       : {subreddit_list}",
        f"  Flagged as low-value: {redundant_count} comments ({redundant_pct}%)",
        "",
        "OVERALL SENTIMENT",
        "-" * 40,
        f"  The overall conversation is {sentiment_desc}.",
        f"  Average VADER score : {avg:+.3f}  (range: -1.0 to +1.0)",
        f"  Positive : {stats['positive_comments']:,} comments ({pos_pct}%)",
        f"  Neutral  : {stats['neutral_comments']:,} comments ({neu_pct}%)",
        f"  Negative : {stats['negative_comments']:,} comments ({neg_pct}%)",
        "",
        "KEY THEMES",
        "-" * 40,
        f"  {themes_text}",
        "",
        "LEADING COMMUNITY VOICE",
        "-" * 40,
        "  Most upvoted comment:",
        top_upvoted or "  (none found)",
        "",
        "POSITIVE SIGNALS",
        "-" * 40,
        "  Strongest positive voice:",
        top_pos or "  (no strongly positive comments detected)",
        "",
        "AREAS OF FRICTION",
        "-" * 40,
        "  Strongest negative voice:",
        top_neg or "  (no strongly negative comments detected)",
        "",
    ]

    report_lines += [
        "",
        "METHODOLOGY",
        "-" * 40,
        "  Sentiment: VADER (Valence Aware Dictionary and sEntiment Reasoner)",
        "  Thresholds: positive ≥ 0.05, negative ≤ -0.05, neutral in between.",
        "  Themes: top keyword frequency (stopwords excluded).",
        "  Potential redundancy flag: comments < 30 chars or matching filler patterns.",
        "",
        "=" * 60,
    ]

    return "\n".join(report_lines)
