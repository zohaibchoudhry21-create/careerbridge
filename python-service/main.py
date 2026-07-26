import os
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

from chunker import chunk_text
from extractor import extract_pdf

app = FastAPI(title="AI CareerBridge PDF Extractor", version="1.0.0")

# Only the Node backend should call this service (server-to-server).
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("PYTHON_SERVICE_CORS_ORIGINS", "http://localhost:5000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"resume", "job_description"}
MAX_UPLOAD_BYTES = int(os.getenv("PYTHON_SERVICE_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_PAGES = int(os.getenv("PYTHON_SERVICE_MAX_PAGES", "50"))
SERVICE_API_KEY = os.getenv("PYTHON_SERVICE_API_KEY", "").strip()


async def require_service_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    if not SERVICE_API_KEY:
        # Misconfigured deployment — refuse rather than run open.
        raise HTTPException(
            status_code=503,
            detail="PYTHON_SERVICE_API_KEY is not configured on the extractor service.",
        )
    if not x_api_key or x_api_key != SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized.")


@app.get("/")
async def root():
    return {
        "service": "AI CareerBridge PDF Extractor",
        "status": "running",
        "endpoints": {
            "health": "GET /health",
            "extract": "POST /extract (multipart: file, type=resume|job_description)",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok", "auth_configured": bool(SERVICE_API_KEY)}


@app.post("/extract", dependencies=[Depends(require_service_api_key)])
async def extract(
    file: UploadFile = File(...),
    type: str = Form(...),
):
    if type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type '{type}'. Must be one of: {', '.join(sorted(ALLOWED_TYPES))}",
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(pdf_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"PDF exceeds maximum size of {MAX_UPLOAD_BYTES} bytes.",
        )
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF.")

    try:
        extraction = extract_pdf(pdf_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {exc}") from exc

    pages = int(extraction.get("pages") or 0)
    if pages > MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF has too many pages ({pages}). Maximum allowed is {MAX_PAGES}.",
        )

    chunks = chunk_text(
        extraction["full_text"],
        page_texts=extraction["page_texts"],
        chunk_size=800,
        overlap=100,
    )

    response_chunks = [
        {
            "text": chunk["text"],
            "page": chunk["page"],
            "metadata": chunk.get("metadata", {}),
        }
        for chunk in chunks
    ]

    if not response_chunks and extraction["full_text"]:
        response_chunks = [{"text": extraction["full_text"], "page": 1, "metadata": {"chunk_index": 0}}]

    return {
        "success": True,
        "type": type,
        "pages": extraction["pages"],
        "chunks": response_chunks,
        "full_text": extraction["full_text"],
        "metadata": extraction["metadata"],
    }
