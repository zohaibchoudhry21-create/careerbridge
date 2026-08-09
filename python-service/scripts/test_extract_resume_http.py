#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

key = os.getenv("PYTHON_SERVICE_API_KEY", "").strip()
pdf = ROOT / "tests" / "fixtures" / "complex-resume.pdf"

if not pdf.exists():
    print("missing fixture", pdf)
    sys.exit(1)

body = pdf.read_bytes()
boundary = "----CareerBridgeBoundary"
payload = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="{pdf.name}"\r\n'
    "Content-Type: application/pdf\r\n\r\n"
).encode() + body + f"\r\n--{boundary}--\r\n".encode()

request = urllib.request.Request(
    "http://localhost:8000/extract-resume",
    data=payload,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "X-API-Key": key,
    },
    method="POST",
)

with urllib.request.urlopen(request, timeout=60) as response:
    result = json.loads(response.read().decode())
    print("status", response.status)
    print(json.dumps({"success": result.get("success"), "line_count": len(result.get("lines") or [])}, indent=2))
