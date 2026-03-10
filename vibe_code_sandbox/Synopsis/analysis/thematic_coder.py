"""
thematic_coder.py
-----------------
Semantic thematic coding engine for Reddit comment datasets.

Uses Claude (claude-opus-4-6 with adaptive thinking) to identify meaningful
recurring themes based on underlying user intent — not keyword matching.

Comment-level output per comment_id:
  - themes         : list of theme labels (multiple allowed)
  - primary_theme  : the dominant theme
  - rationale      : why these themes apply

Dataset-level output per theme:
  - theme_label            : short display label
  - theme_definition       : what this theme means in this dataset
  - prevalence             : approximate % of comments referencing it
  - signal_strength        : "strong" | "moderate" | "emerging"
  - representative_examples: list of comment excerpts
  - related_themes         : other theme labels this connects to
  - research_takeaway      : what this reveals about users
  - product_implication    : how a product team could respond
"""

import json
import os
from typing import Optional

import anthropic
import pandas as pd

# Cap the number of comments sent to Claude to stay within context limits.
# We take the highest-upvoted comments so the most signal-rich posts are coded.
MAX_COMMENTS = 300


_client: Optional[anthropic.Anthropic] = None


def _get_client():  # type: () -> anthropic.Anthropic
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def run_thematic_analysis(df: pd.DataFrame) -> dict:
    """
    Run semantic thematic coding on a comments DataFrame.

    Returns:
        {
          "comment_themes": {
              "<comment_id>": {
                  "themes": [...],
                  "primary_theme": "...",
                  "rationale": "..."
              }
          },
          "dataset_themes": [ { theme object }, ... ]
        }

    Returns empty structure on failure (missing API key, network error, etc.)
    so the rest of the pipeline is never blocked.
    """
    if df.empty:
        return {"comment_themes": {}, "dataset_themes": []}

    # Sample: prefer highest-upvoted so we analyse the most signal-rich comments
    sample = (
        df if len(df) <= MAX_COMMENTS
        else df.nlargest(MAX_COMMENTS, "upvotes")
    )

    # Build the comment list for the prompt
    lines = []
    for _, row in sample.iterrows():
        body = str(row["comment_body"])[:600].replace("\n", " ")
        lines.append(
            f'[{row["comment_id"]}] u/{row["author"]} '
            f'(↑{int(row["upvotes"])}, {row["sentiment_label"]}): {body}'
        )

    prompt = f"""You are an expert qualitative UX researcher performing rigorous thematic coding \
on a dataset of Reddit comments. Your goal is to surface meaningful patterns in user needs, \
frustrations, motivations, perceptions, behaviors, objections, and desired outcomes.

DATASET ({len(sample)} comments):
{chr(10).join(lines)}

CODING RULES:
- Themes must emerge from the data — do not use predefined categories.
- Base assignment on semantic meaning and underlying user intent, NOT surface keywords.
- A single comment may belong to multiple themes if it expresses multiple distinct ideas.
- Group semantically similar ideas under one theme even when phrased differently.
- Prefer 5–12 strong, well-defined themes over many narrow or redundant ones.
- Clearly distinguish strong recurring themes from weaker emerging signals.
- Theme labels must be short (1–4 words), title-case, human-readable.

Return a single JSON object — no markdown fences, no text outside the JSON:

{{
  "comment_themes": {{
    "<comment_id>": {{
      "themes": ["Theme Label A", "Theme Label B"],
      "primary_theme": "Theme Label A",
      "rationale": "One-sentence explanation of why these themes apply to this comment."
    }}
  }},
  "dataset_themes": [
    {{
      "theme_label": "Short Label",
      "theme_definition": "What this theme represents in this specific dataset.",
      "prevalence": "~35% of comments",
      "signal_strength": "strong",
      "representative_examples": [
        "Exact short excerpt from a comment",
        "Another excerpt"
      ],
      "related_themes": ["Other Label"],
      "research_takeaway": "What this pattern reveals about users.",
      "product_implication": "How a product team could act on this."
    }}
  ]
}}"""

    try:
        client = _get_client()
        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=8000,
            thinking={"type": "adaptive"},
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            final = stream.get_final_message()

        # Extract the text block (thinking blocks are separate)
        raw = next(
            (block.text for block in final.content if block.type == "text"), ""
        ).strip()

        # Strip accidental markdown code fences
        if raw.startswith("```"):
            start = raw.find("{")
            end = raw.rfind("}") + 1
            raw = raw[start:end]

        return json.loads(raw)

    except Exception as exc:
        # Log but never crash the main pipeline
        print(f"[thematic_coder] Analysis failed: {exc}")
        return {"comment_themes": {}, "dataset_themes": []}
