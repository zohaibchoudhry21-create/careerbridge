import re
from typing import Any


def count_tokens(text: str) -> int:
    """Approximate token count using whitespace-delimited words."""
    if not text:
        return 0
    return len(re.findall(r"\S+", text))


def chunk_text(
    full_text: str,
    page_texts: list[dict[str, Any]] | None = None,
    chunk_size: int = 800,
    overlap: int = 100,
) -> list[dict[str, Any]]:
    if not full_text.strip():
        return []

    words = re.findall(r"\S+", full_text)
    if not words:
        return []

    # Map character offsets to page numbers when available
    page_offsets: list[tuple[int, int, int]] = []
    if page_texts:
        offset = 0
        for item in page_texts:
            page_num = int(item.get("page", 1))
            page_text = item.get("text", "")
            start = offset
            end = offset + len(page_text)
            page_offsets.append((start, end, page_num))
            offset = end + 2  # account for page joiner "\n\n"

    def page_for_offset(char_offset: int) -> int:
        for start, end, page_num in page_offsets:
            if start <= char_offset < end:
                return page_num
        return page_offsets[-1][2] if page_offsets else 1

    chunks: list[dict[str, Any]] = []
    step = max(1, chunk_size - overlap)
    index = 0

    while index < len(words):
        slice_words = words[index : index + chunk_size]
        text = " ".join(slice_words)

        char_offset = len(" ".join(words[:index]))
        page = page_for_offset(char_offset)

        chunks.append(
            {
                "text": text,
                "page": page,
                "metadata": {
                    "chunk_index": len(chunks),
                    "token_estimate": count_tokens(text),
                    "word_start": index,
                    "word_end": index + len(slice_words),
                },
            }
        )

        if index + chunk_size >= len(words):
            break
        index += step

    return chunks
