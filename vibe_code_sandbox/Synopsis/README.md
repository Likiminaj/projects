# Synopsis — Reddit Research Synthesiser

A local web application that converts Reddit discussions into structured research output.

Paste Reddit thread URLs → get a comment table, sentiment analysis, summary statistics, a qualitative synthesis report, and a curated quote bank — all in your browser.

---

## Requirements

- Python 3.9 or higher
- [Ollama](https://ollama.com) (for AI thematic analysis — free, runs locally)

---

## Setup

### 1. Clone or download the project

```bash
cd /path/to/Synopsis
```

### 2. Install Ollama and pull a model

Ollama runs the thematic coding LLM locally — no API key or cloud account needed.

1. Download and install Ollama from **https://ollama.com**
2. Pull the default model (~2 GB, one-time download):

```bash
ollama pull llama3.2
```

Make sure Ollama is running before you start the app (`ollama serve` or open the Ollama desktop app).

### 3. (Recommended) Create a virtual environment

```bash
python3 -m venv venv
```

Activate it:

- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```
- **Windows:**
  ```bash
  venv\Scripts\activate
  ```

### 4. Install Python dependencies

**Important:** Always install via the Python you'll use to run the app, to avoid "module not found" errors:

```bash
python3 -m pip install -r requirements.txt
```

This installs:

| Package | Version | Purpose |
|---|---|---|
| `flask` | `>=3.0.0` | Web server |
| `python-dotenv` | `>=1.0.0` | Loads optional `.env` config |
| `requests` | `>=2.31.0` | Fetching Reddit JSON data |
| `pandas` | `>=2.1.0` | Structuring and analysing comment data |
| `nltk` | `>=3.8.1` | NLP toolkit (required by VADER) |
| `vaderSentiment` | `>=3.3.2` | Rule-based sentiment scoring |
| `openai` | `>=1.30.0` | Client for Ollama's OpenAI-compatible API |
| `sentence-transformers` | `==2.7.0` | Encodes comments into semantic embeddings |
| `transformers` | `<4.51` | Transformer model backend (pinned for Python 3.9 / torch 2.2 compatibility) |
| `hdbscan` | `>=0.8.33` | Density-based clustering (no need to specify k) |
| `scikit-learn` | `>=1.3.0` | TF-IDF keyword extraction for cluster labels |
| `numpy` | `>=1.24.0,<2` | Numerical operations (pinned `<2` for torch 2.2 compatibility) |

### 5. Download the VADER lexicon

```bash
python3 -c "import nltk; nltk.download('vader_lexicon')"
```

This is a one-time download. If skipped it will download automatically on first run.

---

## Running the App

```bash
python3 app.py
```

You should see output like:

```
 * Running on http://127.0.0.1:5001
 * Debug mode: on
```

Open your browser and go to:

```
http://localhost:5001
```

---

## How to Use

1. **Paste Reddit URLs** into the text area — one URL per line.
   - Example:
     ```
     https://www.reddit.com/r/Python/comments/abc123/some_interesting_post/
     https://www.reddit.com/r/webdev/comments/xyz789/another_thread/
     ```
2. Click **Process Threads**.
3. Wait while the app fetches comments and runs analysis (takes a few seconds per thread).
4. Review the results:
   - **Summary Statistics** — totals and sentiment breakdown
   - **Synthesis Report** — a qualitative written summary
   - **Quote Bank** — curated quotes by category (most upvoted, strong positive/negative, unmet needs, refusals)
   - **Comment Data** — the full table with all columns
5. Click **Export CSV** to download the full dataset.

---

## Project Structure

```
Synopsis/
├── app.py                        # Flask app — routes and orchestration
├── requirements.txt              # Python dependencies
├── utils/
│   ├── __init__.py
│   └── reddit_fetcher.py         # Fetches Reddit JSON API, flattens comment trees
├── analysis/
│   ├── __init__.py
│   ├── sentiment.py              # VADER sentiment scoring and redundancy flagging
│   ├── synthesizer.py            # Summary stats, qualitative report, quote bank
│   ├── thematic_coder.py         # Ollama-powered thematic coding (no keywords)
│   └── semantic_clusterer.py     # Sentence embeddings + HDBSCAN + TF-IDF labels
├── templates/
│   ├── index.html                # Input / landing page
│   └── results.html              # Results display page
├── static/
│   ├── style.css                 # All styling
│   └── app.js                    # JavaScript (form, rendering, pagination)
└── README.md
```

---

## Output Columns (CSV)

| Column | Description |
|---|---|
| `thread_title` | Title of the Reddit post |
| `subreddit` | Subreddit name |
| `thread_url` | Original URL you submitted |
| `comment_id` | Reddit's unique ID for the comment |
| `parent_id` | ID of the parent comment (or post) |
| `author` | Reddit username |
| `comment_body` | Full comment text |
| `upvotes` | Net upvote count |
| `created_utc` | Timestamp (UTC) |
| `sentiment_score` | VADER compound score: -1.0 (most negative) to +1.0 (most positive) |
| `sentiment_label` | `positive`, `neutral`, or `negative` |
| `potential_redundancy` | `True` if the comment appears short or low-value |

---

## Notes

- **No Reddit API credentials needed.** The app uses Reddit's public JSON API (append `.json` to any thread URL).
- **No Anthropic / OpenAI account needed.** Thematic analysis runs via Ollama locally. To use a different model set `OLLAMA_MODEL=<name>` in your environment (e.g. `OLLAMA_MODEL=mistral`).
- **Rate limiting:** A 1.5-second delay is added between thread requests to be polite to Reddit's servers.
- **Repeated comments are kept**, not deduplicated — they represent signal strength. Use the `potential_redundancy` flag to filter if needed.
- **Embedding cache:** Computed embeddings are stored in `.embedding_cache/` so reprocessing identical comment sets is instant.
- The app runs locally only (`127.0.0.1`) — your data never leaves your machine.

---

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

To deactivate the virtual environment when you're done:

```bash
deactivate
```
