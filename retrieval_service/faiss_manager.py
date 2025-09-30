import faiss
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.extensions import connection as PgConnection
from sentence_transformers import SentenceTransformer
import os
from typing import List, Tuple

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, os.pardir))

DEFAULT_MODEL = 'all-mpnet-base-v2'
DEFAULT_INDEX_PATH = os.path.join(PROJECT_ROOT, 'data/faiss.index')

# --- PostgreSQL Configuration ---
DB_NAME = "haasp_db"
DB_USER = "haasp_user"
DB_PASSWORD = "haasp_password"
DB_HOST = "localhost"
DB_PORT = "5432"

CHUNK_SIZE = 512
CHUNK_OVERLAP = 128

class FaissManager:
    """
    Manages FAISS vector indexing and document storage in a PostgreSQL database.
    """
    def __init__(self, model_name: str = DEFAULT_MODEL, index_path: str = DEFAULT_INDEX_PATH):
        print("Initializing FaissManager with PostgreSQL backend...")
        self.index_path = index_path

        self.conn = self._init_db_connection()
        self._create_tables()

        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()

        self.index = self._load_index()
        print("FaissManager initialized successfully.")

    def _init_db_connection(self) -> PgConnection:
        """Initializes and returns a persistent PostgreSQL database connection."""
        print(f"Attempting to connect to PostgreSQL database '{DB_NAME}'...")
        try:
            conn = psycopg2.connect(
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port=DB_PORT
            )
            print("PostgreSQL connection successful.")
            return conn
        except psycopg2.OperationalError as e:
            print(f"Database connection error: {e}")
            raise

    def _create_tables(self):
        """Creates the necessary database tables using the persistent connection."""
        try:
            with self.conn.cursor() as cursor:
                print("Creating 'chunks' table if it doesn't exist.")
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS chunks (
                        id SERIAL PRIMARY KEY,
                        doc_id TEXT NOT NULL,
                        chunk_text TEXT NOT NULL,
                        vector_id BIGINT NOT NULL UNIQUE
                    )
                ''')
                self.conn.commit()
                print("'chunks' table created or already exists.")
        except psycopg2.Error as e:
            print(f"Database error during table creation: {e}")
            self.conn.rollback()
            raise

    def _load_index(self) -> faiss.Index:
        """Loads the FAISS index from disk, or creates a new one if it doesn't exist."""
        if os.path.exists(self.index_path):
            print(f"Loading existing FAISS index from {self.index_path}")
            return faiss.read_index(self.index_path)
        else:
            print("No existing index found. Creating a new one.")
            return faiss.IndexIDMap(faiss.IndexFlatL2(self.dimension))

    def _save_index(self):
        """Saves the current FAISS index to disk."""
        print(f"Saving FAISS index to {self.index_path}")
        faiss.write_index(self.index, self.index_path)

    def _chunk_text(self, text: str) -> List[str]:
        """Splits a long text into smaller, overlapping chunks."""
        tokens = text.split()
        chunks = []
        for i in range(0, len(tokens), CHUNK_SIZE - CHUNK_OVERLAP):
            chunk = " ".join(tokens[i:i + CHUNK_SIZE])
            chunks.append(chunk)
        return chunks

    def add_document(self, doc_id: str, content: str):
        """
        Chunks a document, generates embeddings, adds them to the index,
        and stores the chunk information in the PostgreSQL database.
        """
        print(f"Adding document: {doc_id}")
        chunks = self._chunk_text(content)
        if not chunks:
            print(f"No chunks generated for document {doc_id}. Skipping.")
            return

        embeddings = self.model.encode(chunks, convert_to_tensor=False)

        start_id = self.index.ntotal
        vector_ids = np.arange(start_id, start_id + len(chunks))

        self.index.add_with_ids(embeddings.astype('float32'), vector_ids)

        try:
            with self.conn.cursor() as cursor:
                for i, chunk in enumerate(chunks):
                    cursor.execute(
                        "INSERT INTO chunks (doc_id, chunk_text, vector_id) VALUES (%s, %s, %s)",
                        (doc_id, chunk, int(vector_ids[i]))
                    )
            self.conn.commit()
        except psycopg2.Error as e:
            print(f"Database error during insert: {e}")
            self.conn.rollback()
            raise

        self._save_index()
        print(f"Successfully added {len(chunks)} chunks for document {doc_id}.")

    def search(self, query: str, k: int = 5) -> List[dict]:
        """
        Performs a vector search and retrieves chunk data from PostgreSQL.
        """
        print(f"Searching for: '{query}' with k={k}")
        query_embedding = self.model.encode([query], convert_to_tensor=False)
        distances, vector_ids = self.index.search(query_embedding.astype('float32'), k)

        results = []
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Use a tuple for the IN clause
                vec_ids_tuple = tuple(int(vid) for vid in vector_ids[0] if vid != -1)
                if not vec_ids_tuple:
                    return []

                cursor.execute("SELECT doc_id, chunk_text, vector_id FROM chunks WHERE vector_id IN %s", (vec_ids_tuple,))
                rows = cursor.fetchall()

                # Create a mapping from vector_id to row for easy lookup
                rows_by_vec_id = {row['vector_id']: row for row in rows}

                for i, vec_id in enumerate(vector_ids[0]):
                    if vec_id in rows_by_vec_id:
                        row = rows_by_vec_id[vec_id]
                        results.append({
                            "doc_id": row['doc_id'],
                            "chunk_text": row['chunk_text'],
                            "score": float(distances[0][i])
                        })
        except psycopg2.Error as e:
            print(f"Database error during search: {e}")
            self.conn.rollback()
            raise

        print(f"Found {len(results)} results.")
        return results

    def reset(self):
        """Clears the database table and resets the FAISS index."""
        print("--- Resetting FaissManager state ---")
        # 1. Truncate the chunks table
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("TRUNCATE TABLE chunks RESTART IDENTITY;")
                self.conn.commit()
                print("Truncated 'chunks' table in PostgreSQL.")
        except psycopg2.Error as e:
            print(f"Could not truncate 'chunks' table: {e}")
            self.conn.rollback()

        # 2. Reset the FAISS index
        if os.path.exists(self.index_path):
            os.remove(self.index_path)
            print(f"Removed FAISS index file: {self.index_path}")
        self.index = self._load_index() # Re-initialize the index
        print("--- Reset complete ---")


    def __del__(self):
        """Destructor to ensure the database connection is closed."""
        if hasattr(self, 'conn') and self.conn:
            print("Closing PostgreSQL connection.")
            self.conn.close()