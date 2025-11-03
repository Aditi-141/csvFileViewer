import csv
from typing import List, Tuple

def preview_csv(path: str, max_rows: int = 100) -> Tuple[list[str], list[list[str]]]:
    headers: List[str] = []
    rows: List[List[str]] = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i == 0:
                headers = row
            else:
                rows.append(row)
            if i >= max_rows:
                break
    return headers, rows
