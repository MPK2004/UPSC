"""
One-off CLI to manually queue a book for ingestion — used for the first
end-to-end test run (before the public upload UI exists). Uploads a local
PDF to the `book-uploads` Storage bucket and inserts a `books` row with
status='pending', which the next scheduled (or manually run) pass of
ingest_pipeline.py will pick up.

Usage:
    python seed_book.py "../NCERT-Class-11-Geography-Part-1.pdf" \
        --title "NCERT Class 11 Geography Part 1" --subject Geography
"""

import argparse
import os
import uuid

from services.supabase_client import supabase

STORAGE_BUCKET = "book-uploads"


def seed(pdf_path: str, title: str, subject: str):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(pdf_path)

    storage_path = f"{uuid.uuid4()}.pdf"
    with open(pdf_path, "rb") as f:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            storage_path, f, {"content-type": "application/pdf"}
        )

    result = supabase.table("books").insert({
        "title": title,
        "subject": subject,
        "storage_path": storage_path,
        "status": "pending",
    }).execute()

    book_id = result.data[0]["id"]
    print(f"Queued book '{title}' as {book_id} (storage_path={storage_path}).")
    print("Run `python ingest_pipeline.py` (or wait for the scheduled GitHub "
          "Action) to process it.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_path")
    parser.add_argument("--title", required=True)
    parser.add_argument("--subject", default="")
    args = parser.parse_args()
    seed(args.pdf_path, args.title, args.subject)
