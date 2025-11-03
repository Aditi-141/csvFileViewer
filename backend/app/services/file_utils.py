# app/services/file_utils.py
from pathlib import Path
from typing import List, Tuple
import csv
import io
import pandas as pd


def _sniff_delimiter(sample: bytes) -> str | None:
    """Try to sniff delimiter from a byte sample."""
    try:
        # try utf-8 first, fall back to latin-1 to avoid decode errors
        text = sample.decode("utf-8-sig", errors="replace")
    except Exception:
        text = sample.decode("latin-1", errors="replace")
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(text, delimiters=[",", ";", "\t", "|"])
        return dialect.delimiter
    except Exception:
        return None


def _read_csv_any(path: str) -> pd.DataFrame:
    """
    Robust CSV reader:
    - Sniffs delimiter with csv.Sniffer
    - Falls back to pandas sep=None (python engine)
    - Then explicit fallbacks for ; , tab, |
    - Skips bad lines and trims spaces after delimiter
    """
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"CSV not found on disk: {path}")

    # Read a small header sample to sniff
    with p.open("rb") as f:
        sample = f.read(128 * 1024)  # 128 KB is plenty to sniff

    detected = _sniff_delimiter(sample)

    # 1) If we detected a delimiter, try with it
    if detected:
        try:
            return pd.read_csv(
                p,
                sep=detected,
                engine="python",
                on_bad_lines="skip",
                encoding="utf-8-sig",
                skipinitialspace=True,   # <-- trims spaces after delimiter
            )
        except Exception:
            pass

    # 2) Let pandas sniff (can handle mixed cases)
    try:
        return pd.read_csv(
            p,
            sep=None,
            engine="python",
            on_bad_lines="skip",
            encoding="utf-8-sig",
            skipinitialspace=True,       # <-- important for " ; " cases
        )
    except Exception:
        pass

    # 3) Explicit fallbacks
    for sep in [";", ",", "\t", "|"]:
        try:
            return pd.read_csv(
                p,
                sep=sep,
                engine="python",
                on_bad_lines="skip",
                encoding="utf-8-sig",
                skipinitialspace=True,
            )
        except Exception:
            continue

    # 4) Last resort (don’t crash)
    return pd.read_csv(
        p,
        engine="python",
        on_bad_lines="skip",
        encoding="utf-8-sig",
        skipinitialspace=True,
    )


def preview_csv(path: str, max_rows: int = 200) -> Tuple[List[str], List[List[str]]]:
    """
    Load CSV and return (headers, rows) for preview.
    Keeps your existing API contract.
    """
    df = _read_csv_any(path)
    if max_rows and max_rows > 0:
        df = df.head(max_rows)

    headers: List[str] = [str(c) for c in df.columns]
    rows: List[List[str]] = df.astype(str).values.tolist()
    return headers, rows
