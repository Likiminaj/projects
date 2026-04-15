"""
semantic_clusterer.py
---------------------
Semantic thematic clustering pipeline for Reddit comment datasets.

Unlike keyword-based approaches (LDA, NMF, TF-IDF), this pipeline groups
comments by *meaning* — two comments phrased completely differently but
expressing the same idea land in the same cluster.

Pipeline
--------
  1. embed_comments()          encode text → dense vectors (Sentence Transformers)
  2. cluster_embeddings()      group by semantic similarity (HDBSCAN)
  3. score_similarity()        cosine similarity of each comment to its cluster centroid
  4. label_clusters()          LLM-generated theme name + description per cluster
  5. run_semantic_clustering()  orchestrates all of the above

Caching
-------
Embeddings are stored in .embedding_cache/ as NumPy .npy files keyed by a
SHA-256 hash of the input texts. Reprocessing the same comments is instant.

Multi-theme extensibility
-------------------------
Each comment result includes a `secondary_clusters` list (currently empty).
To enable soft / overlapping cluster assignment in the future, populate that
list using HDBSCAN's soft-clustering probabilities or a second-pass threshold.
"""

import hashlib
import json
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Sentence Transformers model — ~22 MB, runs on CPU, excellent quality/speed ratio
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Where to persist computed embeddings
CACHE_DIR = Path(".embedding_cache")

# HDBSCAN parameters — tune min_cluster_size for your dataset size
HDBSCAN_MIN_CLUSTER_SIZE = 5   # minimum comments to form a cluster
HDBSCAN_MIN_SAMPLES = 3        # controls conservativeness; higher = fewer, denser clusters

# How many representative comments to send to the LLM per cluster
MAX_REPR_COMMENTS = 5


# ---------------------------------------------------------------------------
# Step 1 — Embedding
# ---------------------------------------------------------------------------

def _cache_key(texts: list) -> str:
    """SHA-256 fingerprint of the full text list — used as the cache filename."""
    joined = "\n---\n".join(texts)
    return hashlib.sha256(joined.encode()).hexdigest()


def embed_comments(texts: list) -> np.ndarray:
    """
    Encode comment texts into dense semantic vectors using all-MiniLM-L6-v2.

    Vectors are L2-normalised, so dot product == cosine similarity.
    Results are cached to disk — subsequent calls with identical input return instantly.

    Args:
        texts: List of raw comment strings.

    Returns:
        Float32 ndarray of shape (n_comments, 384).

    Example:
        >>> vecs = embed_comments(["Great product!", "Loved it", "Terrible quality"])
        >>> vecs.shape
        (3, 384)
    """
    from sentence_transformers import SentenceTransformer

    CACHE_DIR.mkdir(exist_ok=True)
    cache_file = CACHE_DIR / f"{_cache_key(texts)}.npy"

    if cache_file.exists():
        print(f"[semantic_clusterer] Loaded embeddings from cache ({len(texts)} texts)")
        return np.load(cache_file)

    print(f"[semantic_clusterer] Encoding {len(texts)} comments with {EMBEDDING_MODEL}…")
    model = SentenceTransformer(EMBEDDING_MODEL)
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=False,
        normalize_embeddings=True,   # L2-normalise so cosine sim = dot product
    )
    embeddings = embeddings.astype(np.float32)

    np.save(cache_file, embeddings)
    return embeddings


# ---------------------------------------------------------------------------
# Step 2 — Clustering
# ---------------------------------------------------------------------------

def cluster_embeddings(
    embeddings: np.ndarray,
    min_cluster_size: Optional[int] = None,
    min_samples: Optional[int] = None,
) -> np.ndarray:
    """
    Cluster semantic embeddings with HDBSCAN.

    Why HDBSCAN over K-means:
      - No need to specify the number of clusters k
      - Handles variable-density, variable-size clusters
      - Marks outliers / noise as label -1 rather than forcing them into a cluster

    min_cluster_size and min_samples are auto-scaled to the dataset size when not
    provided, so the function works correctly on both small test sets and large
    production datasets.

    Args:
        embeddings:       L2-normalised float32 array of shape (n, d).
        min_cluster_size: Override the minimum comments per cluster.
        min_samples:      Override the HDBSCAN min_samples parameter.

    Returns:
        1D int array of cluster labels (same length as embeddings).
        Label -1 == noise / outlier.

    Example:
        >>> labels = cluster_embeddings(embed_comments(["…", "…", …]))
        >>> set(labels)
        {0, 1, 2, -1}
    """
    import hdbscan

    n = len(embeddings)

    # Scale defaults to dataset size: small datasets need smaller minimums
    # so HDBSCAN can find clusters in sparser spaces.
    #   n=10  → min_cluster_size=2, min_samples=2
    #   n=50  → min_cluster_size=3, min_samples=2
    #   n=300 → min_cluster_size=5, min_samples=3
    if min_cluster_size is None:
        min_cluster_size = max(2, min(HDBSCAN_MIN_CLUSTER_SIZE, n // 10))
    if min_samples is None:
        min_samples = max(2, min(HDBSCAN_MIN_SAMPLES, min_cluster_size - 1))

    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=min_samples,
        metric="euclidean",              # equivalent to cosine on L2-normalised vectors
        cluster_selection_method="eom",  # Excess of Mass — finds compact clusters
    )
    labels = clusterer.fit_predict(embeddings)
    n_clusters = len(set(labels) - {-1})
    n_noise = int((labels == -1).sum())
    print(
        f"[semantic_clusterer] Found {n_clusters} clusters, {n_noise} noise points "
        f"(min_cluster_size={min_cluster_size}, min_samples={min_samples})"
    )
    return labels


# ---------------------------------------------------------------------------
# Step 3 — Similarity scoring
# ---------------------------------------------------------------------------

def score_similarity(embeddings: np.ndarray, labels: np.ndarray) -> np.ndarray:
    """
    Compute each comment's cosine similarity to the centroid of its cluster.

    This tells you how representative a comment is of its theme.
    Noise points (label == -1) receive a score of 0.0.

    Args:
        embeddings: L2-normalised float32 array of shape (n, d).
        labels:     1D int array of cluster labels (from cluster_embeddings).

    Returns:
        1D float32 array of similarity scores in [0, 1].

    Example:
        >>> sims = score_similarity(embeddings, labels)
        >>> sims[5]   # how central is comment #5 to its cluster?
        0.8732
    """
    scores = np.zeros(len(embeddings), dtype=np.float32)
    unique_labels = set(labels) - {-1}

    for label in unique_labels:
        mask = labels == label
        cluster_vecs = embeddings[mask]

        # Compute centroid and re-normalise for a clean dot product
        centroid = cluster_vecs.mean(axis=0)
        norm = np.linalg.norm(centroid)
        if norm > 1e-9:
            centroid = centroid / norm

        # Cosine similarity == dot product because embeddings are already L2-normalised
        scores[mask] = (cluster_vecs @ centroid).astype(np.float32)

    return scores


# ---------------------------------------------------------------------------
# Step 4 — TF-IDF theme labelling (no LLM)
# ---------------------------------------------------------------------------

STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
    "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
    "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of",
    "at", "by", "for", "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "to", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just",
    "don", "should", "now", "d", "ll", "m", "o", "re", "ve", "y", "ain", "aren",
    "couldn", "didn", "doesn", "hadn", "hasn", "haven", "isn", "ma", "mightn",
    "mustn", "needn", "shan", "shouldn", "wasn", "weren", "won", "wouldn",
    "im", "ive", "id", "youre", "youve", "youd", "hes", "shes", "its", "were",
    "theyre", "theyve", "theyd", "weve", "wed", "cant", "wont", "dont", "didnt",
    "doesnt", "isnt", "arent", "wasnt", "werent", "hasnt", "havent", "hadnt",
    "wouldnt", "shouldnt", "couldnt", "mustnt", "oh", "yeah", "yes", "no", "ok",
    "okay", "like", "get", "got", "go", "going", "goes", "went", "come", "comes",
    "came", "make", "makes", "made", "know", "knows", "knew", "think", "thinks",
    "thought", "see", "sees", "saw", "want", "wants", "wanted", "use", "uses",
    "used", "really", "actually", "probably", "maybe", "always", "never",
    "sometimes", "often", "usually", "even", "still", "also", "well", "much",
    "many", "thing", "things", "way", "ways", "would", "could", "one", "two",
    "first", "new", "good", "bad", "right", "want", "lot", "right", "thats",
    "dont", "cant", "wont", "youre", "theyre", "hes", "shes", "whats", "heres",
    "theres", "whos", "lets", "said", "say", "says", "since", "back", "look",
    "looking", "tried", "try", "trying", "put", "keep", "keeps", "let", "get",
    "getting", "give", "gives", "gave", "tell", "tells", "take", "takes", "took",
    "need", "needs", "feel", "feels", "felt", "point", "take", "people",
}

def _extract_theme_keywords(comments: list) -> dict:
    """
    Generate theme metadata from cluster comments using TF-IDF.
    No LLM required.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer

    if not comments:
        return {}

    vectorizer = TfidfVectorizer(
        max_features=50,
        stop_words=list(STOPWORDS),
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.8,
    )

    try:
        tfidf_matrix = vectorizer.fit_transform(comments)
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.sum(axis=0).A1

        ranked = sorted(zip(feature_names, scores), key=lambda x: x[1], reverse=True)

        top_keywords = [kw for kw, _ in ranked[:5]]

        if len(top_keywords) >= 3:
            theme_name = " / ".join(top_keywords[:3]).title()
        elif top_keywords:
            theme_name = top_keywords[0].title()
        else:
            theme_name = "General"

        theme_description = f"Comments about {', '.join(top_keywords[:4])}."

        top_comment = max(comments, key=lambda c: len(c))[:200]
        signal = "strong" if len(comments) >= 10 else "moderate" if len(comments) >= 5 else "emerging"

        return {
            "theme_name": theme_name,
            "theme_description": theme_description,
            "research_takeaway": f"Users express interest or concern about {top_keywords[0] if top_keywords else 'this topic'}.",
            "product_implication": f"Consider addressing {top_keywords[0] if top_keywords else 'this theme'} based on user feedback.",
            "signal_strength": signal,
        }
    except Exception:
        return {
            "theme_name": "General",
            "theme_description": "A cluster of related comments.",
            "research_takeaway": "",
            "product_implication": "",
            "signal_strength": "moderate",
        }


def label_clusters(
    texts: list,
    labels: np.ndarray,
    similarities: np.ndarray,
) -> dict:
    """
    Generate human-readable theme names and descriptions for all non-noise clusters.

    For each cluster, selects up to MAX_REPR_COMMENTS comments closest to the
    centroid (highest similarity) and extracts theme keywords via TF-IDF.

    Args:
        texts:        Original comment strings (same order as embeddings).
        labels:       Cluster labels from cluster_embeddings().
        similarities: Similarity scores from score_similarity().

    Returns:
        {
          cluster_id (int): {
              "theme_name": str,
              "theme_description": str,
              "size": int,
              "representative_comments": [str, ...]
          },
          ...
        }
    """
    unique_labels = sorted(set(labels) - {-1})
    themes = {}

    for label in unique_labels:
        mask = labels == label
        indices = np.where(mask)[0]

        # Pick comments closest to the centroid — most representative of the theme
        ranked = sorted(indices, key=lambda i: similarities[i], reverse=True)
        top_indices = ranked[:MAX_REPR_COMMENTS]
        representative = [texts[i][:400] for i in top_indices]

        llm_result = _extract_theme_keywords(representative)

        themes[int(label)] = {
            "theme_name":          llm_result.get("theme_name", f"Cluster {label}"),
            "theme_description":   llm_result.get("theme_description", ""),
            "research_takeaway":   llm_result.get("research_takeaway", ""),
            "product_implication": llm_result.get("product_implication", ""),
            "signal_strength":     llm_result.get("signal_strength", ""),
            "size":                int(mask.sum()),
            "representative_comments": representative,
        }

    return themes


# ---------------------------------------------------------------------------
# Step 5 — Main orchestrator
# ---------------------------------------------------------------------------


def run_semantic_clustering(df: pd.DataFrame) -> dict:
    """
    Full semantic clustering pipeline.

    Steps:
      1. Embed comment texts (cached to disk)
      2. Cluster with HDBSCAN (no predefined k, handles noise)
      3. Score cosine similarity of each comment to its cluster centroid
      4. Label clusters via TF-IDF keyword extraction (no LLM)

    Args:
        df: DataFrame with 'comment_id' and 'comment_body' columns.

    Returns:
        {
          "comment_clusters": {
              "<comment_id>": {
                  "cluster_id":        int,    # -1 = noise / outlier
                  "similarity":        float,  # cosine similarity to centroid, 0–1
                  "primary_theme":     str,    # keyword-based theme name, or "Outlier"
                  "secondary_clusters": []     # reserved for multi-theme support
              },
              ...
          },
          "themes": {
              "<cluster_id>": {
                  "theme_name":              str,
                  "theme_description":       str,
                  "size":                    int,
                  "representative_comments": [str, ...]
              },
              ...
          },
          "noise_count": int   # comments assigned to no cluster
        }
    """
    if df.empty:
        return {"comment_clusters": {}, "themes": {}, "noise_count": 0}

    texts = df["comment_body"].astype(str).tolist()
    ids = df["comment_id"].astype(str).tolist()

    # 1 — Embed (cached)
    embeddings = embed_comments(texts)

    # 2 — Cluster
    labels = cluster_embeddings(embeddings)

    # 3 — Score
    similarities = score_similarity(embeddings, labels)

    # 4 — Label clusters via TF-IDF
    themes = label_clusters(texts, labels, similarities)

    # 5 — Assemble per-comment output
    comment_clusters = {}
    for i, cid in enumerate(ids):
        cluster_id = int(labels[i])
        is_noise = cluster_id == -1

        comment_clusters[cid] = {
            "cluster_id": cluster_id,
            "similarity": round(float(similarities[i]), 4),
            "primary_theme": (
                "Outlier" if is_noise
                else themes.get(cluster_id, {}).get("theme_name", f"Cluster {cluster_id}")
            ),
            "secondary_clusters": [],
        }

    noise_count = int((labels == -1).sum())

    return {
        "comment_clusters": comment_clusters,
        "themes": themes,
        "noise_count": noise_count,
    }
