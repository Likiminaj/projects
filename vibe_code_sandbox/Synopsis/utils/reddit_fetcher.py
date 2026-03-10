"""
reddit_fetcher.py
-----------------
Fetches Reddit thread data and comments using Reddit's public JSON API.
No API credentials required — just appends .json to any Reddit URL.
"""

import requests
import time
import re
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse


# How long to wait between requests when fetching multiple threads (seconds).
# This is polite behavior and avoids Reddit rate-limiting us.
REQUEST_DELAY = 1.5

# HTTP headers to send with every request.
# Reddit requires a descriptive User-Agent or it may block the request.
HEADERS = {
    "User-Agent": "synopsis-research-tool/1.0 (local research synthesizer)"
}


def normalize_reddit_url(raw_url: str) -> str:
    """
    Convert any Reddit URL variant into a clean JSON API URL.

    Handles:
      - reddit.com, www.reddit.com, old.reddit.com
      - Trailing slashes, query strings, fragments

    Returns a URL like:
      https://www.reddit.com/r/subreddit/comments/abc123.json
    """
    url = raw_url.strip()

    # Replace old.reddit.com or new.reddit.com with www.reddit.com
    url = re.sub(r"https?://(old\.|new\.|www\.)?reddit\.com", "https://www.reddit.com", url)

    # Parse the URL to clean it up
    parsed = urlparse(url)

    # Rebuild the path: strip trailing slash, remove existing .json if present
    path = parsed.path.rstrip("/").replace(".json", "")

    # Reconstruct URL without query params or fragments, then add .json
    clean_url = urlunparse(("https", "www.reddit.com", path, "", "", ""))
    return clean_url + ".json"


def validate_reddit_url(url: str) -> bool:
    """
    Check that a URL looks like a Reddit thread link.
    A valid thread URL contains /comments/ in the path.
    """
    return bool(re.search(r"reddit\.com/r/\w+/comments/", url))


def flatten_comments(comment_list: list, thread_title: str, subreddit: str,
                     thread_url: str, parent_id: str = None) -> list:
    """
    Recursively walk the nested Reddit comment tree and produce a flat list.

    Reddit stores comments as a tree where each comment can have `replies`
    containing more comments. We walk the whole tree and collect every
    comment as a flat dictionary.

    Args:
        comment_list: List of Reddit comment objects from the JSON API.
        thread_title: Title of the parent thread (for the output table).
        subreddit: Subreddit name (for the output table).
        thread_url: Original URL submitted by the user.
        parent_id: The ID of the parent comment (None for top-level comments).

    Returns:
        A flat list of comment dicts, one per comment.
    """
    rows = []

    for item in comment_list:
        kind = item.get("kind")

        # Skip "more" objects — these are placeholders for collapsed comment chains
        if kind == "more":
            continue

        data = item.get("data", {})
        body = data.get("body", "")

        # Skip only truly empty comments or ones whose body is [deleted]/[removed]
        if not body or body.strip().lower() in ("[deleted]", "[removed]"):
            continue

        # Convert Unix timestamp to a readable UTC datetime string
        created_ts = data.get("created_utc", 0)
        created_str = datetime.fromtimestamp(created_ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        # Build the row for this comment
        row = {
            "thread_title": thread_title,
            "subreddit": subreddit,
            "thread_url": thread_url,
            "comment_id": data.get("id", ""),
            # parent_id passed in for replies; fall back to the field in the data
            "parent_id": parent_id if parent_id else data.get("parent_id", ""),
            "author": data.get("author", "[deleted]"),
            "comment_body": body,
            # Use ups (upvotes); score is sometimes the same but ups is more explicit
            "upvotes": data.get("ups", 0),
            "created_utc": created_str,
        }
        rows.append(row)

        # Recurse into replies if they exist
        replies = data.get("replies", "")
        if replies and isinstance(replies, dict):
            reply_children = replies.get("data", {}).get("children", [])
            if reply_children:
                # The parent_id for these replies is this comment's ID
                child_rows = flatten_comments(
                    reply_children,
                    thread_title,
                    subreddit,
                    thread_url,
                    parent_id=data.get("id", "")
                )
                rows.extend(child_rows)

    return rows


def fetch_thread(url: str) -> dict:
    """
    Fetch a single Reddit thread and return all its comments as a list of dicts.

    Args:
        url: A Reddit thread URL (any format — will be normalized).

    Returns:
        A dict with:
          - 'comments': list of comment row dicts
          - 'thread_title': str
          - 'subreddit': str
          - 'error': str or None
    """
    result = {"comments": [], "thread_title": "", "subreddit": "", "error": None}

    # Validate that this looks like a Reddit thread URL
    if not validate_reddit_url(url):
        result["error"] = f"Not a valid Reddit thread URL: {url}"
        return result

    # Build the JSON API URL with a high comment limit
    json_url = normalize_reddit_url(url) + "?limit=500&depth=10"

    try:
        response = requests.get(json_url, headers=HEADERS, timeout=15)
        response.raise_for_status()  # Raises an exception for 4xx/5xx responses
    except requests.exceptions.Timeout:
        result["error"] = f"Request timed out for: {url}"
        return result
    except requests.exceptions.HTTPError as e:
        result["error"] = f"HTTP error fetching {url}: {e}"
        return result
    except requests.exceptions.RequestException as e:
        result["error"] = f"Network error fetching {url}: {e}"
        return result

    try:
        data = response.json()
    except ValueError:
        result["error"] = f"Could not parse JSON from: {url}"
        return result

    # Reddit's JSON returns a two-element list:
    #   data[0] = post metadata
    #   data[1] = comment tree
    if not isinstance(data, list) or len(data) < 2:
        result["error"] = f"Unexpected JSON structure from: {url}"
        return result

    # Extract post-level metadata
    post_data = data[0]["data"]["children"][0]["data"]
    thread_title = post_data.get("title", "Unknown Thread")
    subreddit = post_data.get("subreddit", "unknown")

    result["thread_title"] = thread_title
    result["subreddit"] = subreddit

    # Extract and flatten all comments from the comment tree
    comment_children = data[1]["data"]["children"]
    comments = flatten_comments(comment_children, thread_title, subreddit, url.strip())

    if not comments:
        result["error"] = f"No comments found in thread: {url}"
        return result

    result["comments"] = comments
    return result


def fetch_all_threads(urls: list) -> dict:
    """
    Fetch multiple Reddit threads and combine all comments into one list.

    Args:
        urls: List of Reddit thread URL strings.

    Returns:
        A dict with:
          - 'comments': combined list of all comment rows
          - 'errors': list of error strings (one per failed thread)
          - 'fetched_count': number of threads successfully fetched
    """
    all_comments = []
    errors = []
    fetched_count = 0

    for i, url in enumerate(urls):
        url = url.strip()
        if not url:
            continue  # Skip blank lines

        # Add a delay between requests to be a polite API consumer
        if i > 0:
            time.sleep(REQUEST_DELAY)

        result = fetch_thread(url)

        if result["error"]:
            errors.append(result["error"])
        else:
            all_comments.extend(result["comments"])
            fetched_count += 1

    return {
        "comments": all_comments,
        "errors": errors,
        "fetched_count": fetched_count
    }
