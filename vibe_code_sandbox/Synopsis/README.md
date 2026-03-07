# Synopsis — Reddit Research Synthesiser

A local web application that converts Reddit discussions into structured research output.

Paste Reddit thread URLs → get a comment table, sentiment analysis, summary statistics, a qualitative synthesis report, and a curated quote bank — all in your browser.

---

## Requirements

- Python 3.9 or higher
- pip (comes with Python)

---

## Setup

### 1. Clone or download the project

If you haven't already, open a terminal and navigate to the project folder:

```bash
cd /path/to/Synopsis
```

### 2. (Recommended) Create a virtual environment

A virtual environment keeps the project's dependencies isolated from the rest of your system.

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

You should see `(venv)` at the start of your terminal prompt.

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This installs:
| Package | Purpose |
|---|---|
| `flask` | Web server |
| `requests` | Fetching Reddit data |
| `pandas` | Structuring comment data |
| `vaderSentiment` | Sentiment analysis |
| `nltk` | Natural language toolkit (used by VADER) |

### 4. Download the VADER lexicon

VADER needs a small data file the first time it runs. You can download it in advance:

```bash
python3 -c "import nltk; nltk.download('vader_lexicon')"
```

If you skip this step, it will download automatically on first use — you just need an internet connection.

---

## Running the App

```bash
python3 app.py
```

You should see output like:

```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

Open your browser and go to:

```
http://localhost:5000
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
├── app.py                   # Flask app — routes and orchestration
├── requirements.txt         # Python dependencies
├── utils/
│   ├── __init__.py
│   └── reddit_fetcher.py    # Fetches Reddit JSON API, flattens comment trees
├── analysis/
│   ├── __init__.py
│   ├── sentiment.py         # VADER sentiment scoring and redundancy flagging
│   └── synthesizer.py       # Summary stats, qualitative report, quote bank
├── templates/
│   └── index.html           # Main HTML page
├── static/
│   ├── style.css            # All styling
│   └── app.js               # Minimal JavaScript (form, rendering, pagination)
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
- **Rate limiting:** A 1.5-second delay is added between thread requests to be polite to Reddit's servers.
- **Repeated comments are kept**, not deduplicated — they represent signal strength. Use the `potential_redundancy` flag to filter if needed.
- The app runs locally only (`127.0.0.1`) — your data never leaves your machine.

---

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

To deactivate the virtual environment when you're done:

```bash
deactivate
```
