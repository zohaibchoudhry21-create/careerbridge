import re


def _normalize_for_compare(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def dedupe_lines(text: str) -> str:
    lines = text.split("\n")
    result: list[str] = []
    prev_norm = None
    for line in lines:
        norm = _normalize_for_compare(line)
        if not norm:
            result.append("")
            prev_norm = None
            continue
        if norm == prev_norm:
            continue
        result.append(line.strip())
        prev_norm = norm
    return "\n".join(result)


def dedupe_paragraphs(text: str) -> str:
    paragraphs = re.split(r"\n\s*\n", text)
    seen: set[str] = set()
    kept: list[str] = []
    for paragraph in paragraphs:
        stripped = paragraph.strip()
        if not stripped:
            continue
        norm = _normalize_for_compare(stripped)
        if len(norm) < 24:
            kept.append(stripped)
            continue
        if norm in seen:
            continue
        if any(norm in previous for previous in seen if len(previous) > len(norm) + 20):
            continue
        seen.add(norm)
        kept.append(stripped)
    return "\n\n".join(kept)


def remove_substring_lines(text: str) -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if len(lines) < 2:
        return text
    kept: list[str] = []
    normalized = [_normalize_for_compare(line) for line in lines]
    for index, line in enumerate(lines):
        norm = normalized[index]
        # Short lines are often skills, dates, or titles — always keep them.
        if len(norm) < 80:
            kept.append(line)
            continue
        # Only remove exact duplicate lines, not substring matches.
        is_exact_duplicate = any(
            norm == other_norm
            for other_index, other_norm in enumerate(normalized)
            if index != other_index
        )
        if not is_exact_duplicate:
            kept.append(line)
    return "\n".join(kept)


def clean_text(text: str) -> str:
    if not text:
        return ""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    # Fix broken hyphenated words: hy-\nphen -> hyphen
    cleaned = re.sub(r"(\w)-\n(\w)", r"\1\2", cleaned)
    lines: list[str] = []
    for line in cleaned.split("\n"):
        line = re.sub(r"[ \t]+", " ", line.strip())
        if not line:
            lines.append("")
            continue
        if re.fullmatch(r"\d{1,4}", line):
            continue
        # FIX: `*` instead of `+` so a single standalone label (e.g. just
        # "Address:") also matches, not only combined lines like
        # "Address: Phone: Email:". Trailing `:` is now mandatory so a bare
        # word like "Email" (no colon) in normal body text isn't stripped.
        if re.fullmatch(
            r"(?:address|phone|email|linkedin|github|tel|mobile)"
            r"(?:\s*:\s*(?:address|phone|email|linkedin|github|tel|mobile))*\s*:",
            line,
            flags=re.IGNORECASE,
        ):
            continue
        lines.append(line)
    cleaned = "\n".join(lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    cleaned = dedupe_lines(cleaned)
    cleaned = remove_substring_lines(cleaned)
    cleaned = dedupe_paragraphs(cleaned)
    return cleaned.strip()
