import glob
import os
import platform
import shutil

import pytesseract

POPPLER_BIN: str | None = None


def _first_existing(paths: list[str]) -> str | None:
    for path in paths:
        if path and os.path.exists(path):
            return path
    return None


def _discover_poppler_bin() -> str | None:
    discovered = shutil.which("pdffonts")
    if discovered:
        return os.path.dirname(discovered)

    if platform.system() != "Windows":
        return None

    winget_pattern = os.path.join(
        os.environ.get("LOCALAPPDATA", ""),
        "Microsoft",
        "WinGet",
        "Packages",
        "oschwartz10612.Poppler_*",
        "poppler-*",
        "Library",
        "bin",
    )
    matches = glob.glob(winget_pattern)
    if matches:
        return sorted(matches)[-1]

    return _first_existing(
        [
            r"C:\poppler\Library\bin",
            r"C:\Program Files\poppler\Library\bin",
        ]
    )


def configure_platform_tools() -> None:
    global POPPLER_BIN

    if platform.system() == "Windows":
        tesseract_cmd = _first_existing(
            [
                shutil.which("tesseract") or "",
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            ]
        )
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    POPPLER_BIN = _discover_poppler_bin()

    if POPPLER_BIN:
        poppler_path = os.environ.get("PATH", "")
        if POPPLER_BIN not in poppler_path:
            os.environ["PATH"] = f"{POPPLER_BIN};{poppler_path}"


configure_platform_tools()
