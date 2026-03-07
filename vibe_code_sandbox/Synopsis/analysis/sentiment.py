"""
sentiment.py
------------
Runs VADER sentiment analysis on Reddit comment text and adds
three columns to the DataFrame:

  sentiment_score    : float from -1.0 (most negative) to +1.0 (most positive)
  sentiment_label    : "positive", "neutral", or "negative"
  potential_redundancy: True if the comment appears low-value or tangential
"""

import re
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


# Initialise the VADER analyser once at module level.
# VADER is a rule-based model tuned for social media text — no training needed.
_analyser = SentimentIntensityAnalyzer()


# --- Sentiment thresholds (standard VADER recommendations) ---
POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


# --- Heuristics for flagging low-value / tangential comments ---

# Comments shorter than this (after stripping whitespace) are likely reactions,
# not substantive research signal.
MIN_SUBSTANTIVE_LENGTH = 30

# Common filler reactions that add no research insight.
FILLER_PATTERNS = [
    r"^\s*(lol|lmao|lmfao|haha|hehe|xd|😂|🤣|👍|👎|💯|this|same|^|f|rip|based|cope|ratio)\s*$",
    r"^\s*[!?\.]+\s*$",          # Only punctuation
    r"^\s*([A-Z])\1{3,}\s*$",    # Repeated single letter like "AAAA"
]
FILLER_RE = [re.compile(p, re.IGNORECASE) for p in FILLER_PATTERNS]


def _score_comment(text: str) -> float:
    """
    Run VADER on a single comment and return the compound score.

    The compound score is a single float in [-1, 1] that summarises
    the overall sentiment. It is the most useful single metric from VADER.
    """
    scores = _analyser.polarity_scores(text)
    return round(scores["compound"], 4)


def _label_from_score(score: float) -> str:
    """Convert a VADER compound score to a human-readable label."""
    if score >= POSITIVE_THRESHOLD:
        return "positive"
    elif score <= NEGATIVE_THRESHOLD:
        return "negative"
    else:
        return "neutral"


def _is_redundant(text: str) -> bool:
    """
    Return True if a comment appears to be low-value or tangential.

    Heuristics used:
      1. Too short to contain a substantive thought.
      2. Matches a known filler / reaction pattern.

    Note: We do NOT remove these comments from the dataset — the spec
    explicitly asks us to keep them (they represent signal strength).
    We only flag them so researchers can filter if they choose.
    """
    stripped = text.strip()

    # Too short
    if len(stripped) < MIN_SUBSTANTIVE_LENGTH:
        return True

    # Matches a filler pattern
    for pattern in FILLER_RE:
        if pattern.match(stripped):
            return True

    return False


def add_sentiment_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add sentiment_score, sentiment_label, and potential_redundancy columns
    to the comments DataFrame in-place.

    Args:
        df: DataFrame with at least a 'comment_body' column.

    Returns:
        The same DataFrame with three new columns added.
    """
    if df.empty:
        df["sentiment_score"] = []
        df["sentiment_label"] = []
        df["potential_redundancy"] = []
        return df

    # Apply scoring and labelling to every comment
    df["sentiment_score"] = df["comment_body"].apply(_score_comment)
    df["sentiment_label"] = df["sentiment_score"].apply(_label_from_score)
    df["potential_redundancy"] = df["comment_body"].apply(_is_redundant)

    return df
