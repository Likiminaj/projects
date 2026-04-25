# Synopsis — CLAUDE.md

## What this project is

A local Flask web app that takes Reddit thread URLs and returns structured research output: sentiment analysis, thematic coding, semantic clustering, a synthesis report, and a quote bank. Everything runs locally — no cloud services except Ollama.

## Stack

- **Python 3.9** via `/usr/bin/python3` (system Python on macOS)
- **Flask** on `127.0.0.1:5001`
- **Ollama** (local LLM) for thematic coding — default model `llama3.2`, served at `http://localhost:11434/v1`
- No Anthropic or OpenAI API keys — the `openai` package is used purely as an Ollama client

## Key files

| File | Role |
|---|---|
| `app.py` | Routes: `GET /`, `GET /results`, `POST /process`, `GET /export` |
| `utils/reddit_fetcher.py` | Hits Reddit's public `.json` API, flattens nested comment trees |
| `analysis/sentiment.py` | VADER scoring, adds `sentiment_score`, `sentiment_label`, `potential_redundancy` |
| `analysis/thematic_coder.py` | Sends top-upvoted comments to Ollama, returns per-comment themes + dataset theme list |
| `analysis/semantic_clusterer.py` | Embeds comments with `all-MiniLM-L6-v2`, clusters with HDBSCAN, labels with TF-IDF |
| `analysis/synthesizer.py` | Pure Python — builds `summary_stats`, `report`, `quote_bank` from the DataFrame |
| `templates/index.html` | Input page |
| `templates/results.html` | Results display page |

## Install dependencies

Always use:
```bash
python3 -m pip install -r requirements.txt
```
Using `pip install` or `pip3 install` directly can install to a different Python than `/usr/bin/python3` and cause `ModuleNotFoundError`.

## Running

Ollama must be running first:
```bash
ollama serve   # or open the Ollama desktop app
```

Then:
```bash
python3 app.py
```

## LLM configuration

`thematic_coder.py` reads two env vars (can be set in `.env`):

| Var | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.2` | Model to use for thematic coding |

## Pipeline order (inside `POST /process`)

1. `fetch_all_threads` — Reddit JSON → flat comment list
2. `add_sentiment_columns` — VADER scores
3. `build_summary_stats` / `build_quote_bank` / `build_report` — pure stats + text
4. `run_thematic_analysis` — Ollama call (can fail gracefully; returns empty dict on error)
5. `run_semantic_clustering` — embeddings + HDBSCAN (caches to `.embedding_cache/`)

Steps 4 and 5 are wrapped in try/except and never block the rest of the pipeline.

## Constraints and gotchas

- `numpy` is pinned `<2` for compatibility with `sentence-transformers` and `torch 2.2.x` on Python 3.9
- `transformers` is pinned `<4.51` for the same reason
- Reddit's public JSON API requires a descriptive `User-Agent` header or requests get blocked
- Max 20 URLs per `/process` request; max 300 comments sent to Ollama (top by upvotes)
- The `_last_dataframe` global in `app.py` is intentional — single-user local app, no concurrency concerns
