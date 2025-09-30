import requests
import json
import time
import os
import sys

# --- Configuration ---
BASE_URL = "http://localhost:8000"
ADD_ENDPOINT = f"{BASE_URL}/add"
SEARCH_ENDPOINT = f"{BASE_URL}/search"
RESET_ENDPOINT = f"{BASE_URL}/reset"

# --- Sample Data ---
DOCUMENTS = {
    "doc1": "The sky is blue and the sun is bright. Birds are singing joyfully.",
    "doc2": "Artificial intelligence (AI) is a branch of computer science focused on creating smart machines.",
    "doc3": "The ocean is vast and deep, full of mysterious creatures. The color of the ocean is also blue."
}

def wait_for_server():
    """Waits for the server to be ready by polling the root endpoint."""
    print("--- Waiting for server to be ready ---")
    retries = 5
    delay = 2
    for i in range(retries):
        try:
            response = requests.get(BASE_URL)
            if response.status_code == 200:
                print("✅ Server is up and running.")
                return True
        except requests.ConnectionError:
            print(f"⏳ Server not ready yet. Retrying in {delay} seconds...")
            time.sleep(delay)
    print("❌ Server did not start. Aborting test.")
    return False

def reset_server_state():
    """Resets the server state by calling the /reset endpoint."""
    print("\n--- Resetting server state ---")
    try:
        response = requests.post(RESET_ENDPOINT)
        response.raise_for_status()
        print(f"✅ Server state reset successfully: {response.json().get('message')}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to reset server state: {e}")
        return False

def add_documents():
    """Adds the sample documents to the index via the API."""
    print("\n--- Adding Documents ---")
    for doc_id, content in DOCUMENTS.items():
        payload = {"doc_id": doc_id, "content": content}
        try:
            response = requests.post(ADD_ENDPOINT, json=payload)
            response.raise_for_status()
            print(f"📄 Added document '{doc_id}': {response.json().get('message')}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to add document '{doc_id}': {e}")
            return False
    return True

def run_search_test():
    """Runs a search query and verifies the result."""
    print("\n--- Running Search Test ---")
    query = "What color is the sky?"
    payload = {"query": query, "k": 1}

    try:
        response = requests.post(SEARCH_ENDPOINT, json=payload)
        response.raise_for_status()
        results = response.json()

        print(f"🔍 Search query: '{query}'")
        print(f"✅ Received {len(results)} result(s).")

        if not results:
            print("❌ TEST FAILED: No results returned.")
            return False

        top_result = results[0]
        print(f"🏆 Top result: Doc ID='{top_result['doc_id']}', Score={top_result['score']:.4f}")
        print(f"   Chunk: '{top_result['chunk_text']}'")

        if top_result['doc_id'] == 'doc1':
            print("\n✅ TEST PASSED: The most relevant document was correctly identified.")
            return True
        else:
            print(f"\n❌ TEST FAILED: Expected doc1, but got {top_result['doc_id']}.")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Search request failed: {e}")
        return False

def main():
    """Main test execution function."""
    if not wait_for_server():
        return

    if not reset_server_state():
        return

    if not add_documents():
        return

    # Give the server a moment to process and save the index
    print("\n...allowing a moment for indexing to settle...")
    time.sleep(1)

    run_search_test()

if __name__ == "__main__":
    main()