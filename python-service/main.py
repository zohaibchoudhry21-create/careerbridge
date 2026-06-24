from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from chunker import chunk_text
from extractor import extract_pdf

app = FastAPI(title="AI CareerBridge PDF Extractor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"resume", "job_description"}


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
    return {"status": "ok"}


@app.post("/extract")
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

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        extraction = extract_pdf(pdf_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {exc}") from exc

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
