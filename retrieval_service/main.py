from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager
from .faiss_manager import FaissManager
from typing import List
import traceback

# --- Data Models ---
class SearchQuery(BaseModel):
    query: str
    k: int = 5

class SearchResult(BaseModel):
    doc_id: str
    chunk_text: str
    score: float

class AddDocumentRequest(BaseModel):
    doc_id: str
    content: str

class AddDocumentResponse(BaseModel):
    status: str
    message: str

# --- Global State ---
# This dictionary will hold our loaded models and managers.
# It's populated during the lifespan event.
lifespan_context = {}

# --- Lifespan Management ---
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the FaissManager and store it in the context
    print("Server starting up...")

    # The FaissManager is now responsible for its own paths.
    # We just need to ensure the data directory exists.
    from .faiss_manager import DEFAULT_INDEX_PATH
    data_dir = os.path.dirname(DEFAULT_INDEX_PATH)
    os.makedirs(data_dir, exist_ok=True)

    lifespan_context["faiss_manager"] = FaissManager()
    yield
    # Shutdown: Clean up resources if necessary
    print("Server shutting down...")
    lifespan_context.clear()

# --- FastAPI App Initialization ---
app = FastAPI(
    title="HAASP Retrieval Service",
    description="A service for advanced, hybrid retrieval including vector, fuzzy, and graph-based search.",
    version="0.1.0",
    lifespan=lifespan,
)

# --- API Endpoints ---
@app.get("/")
def read_root():
    """
    Root endpoint for the retrieval service.
    Provides a simple status check.
    """
    return {"status": "ok", "message": "HAASP Retrieval Service is running."}

@app.post("/search", response_model=List[SearchResult])
def search_vector(query: SearchQuery):
    """
    Performs a vector search for a given query using the FAISS index.
    """
    manager = lifespan_context.get("faiss_manager")
    if not manager:
        raise HTTPException(status_code=503, detail="FaissManager not initialized")

    results = manager.search(query.query, query.k)
    return results

@app.post("/add", response_model=AddDocumentResponse)
def add_document(request: AddDocumentRequest):
    """
    Adds a new document to the FAISS index and SQLite database.
    """
    manager = lifespan_context.get("faiss_manager")
    if not manager:
        raise HTTPException(status_code=503, detail="FaissManager not initialized")

    try:
        manager.add_document(request.doc_id, request.content)
        return {"status": "ok", "message": f"Document '{request.doc_id}' added successfully."}
    except Exception as e:
        print("--- ERROR TRACEBACK ---")
        traceback.print_exc()
        print("-----------------------")
        raise HTTPException(status_code=500, detail=f"Failed to add document: {str(e)}")

@app.post("/reset")
def reset_state():
    """
    Resets the service state by clearing the database and the FAISS index.
    """
    manager = lifespan_context.get("faiss_manager")
    if not manager:
        raise HTTPException(status_code=503, detail="FaissManager not initialized")

    try:
        manager.reset()
        return {"status": "ok", "message": "Service state has been reset."}
    except Exception as e:
        print("--- ERROR TRACEBACK ---")
        traceback.print_exc()
        print("-----------------------")
        raise HTTPException(status_code=500, detail=f"Failed to reset state: {str(e)}")