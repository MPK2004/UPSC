"""
Qdrant Vector Database Integration Service
Connects to Qdrant Cloud Cluster or local fallback instance.
"""

import os
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from dotenv import load_dotenv

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "https://3475f458-eb39-407f-abdb-01fa9139d854.eu-west-2-0.aws.cloud.qdrant.io")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

class QdrantService:
    def __init__(self, collection_name: str = "upsc_geography_environment"):
        self.collection_name = collection_name
        
        try:
            if QDRANT_URL and QDRANT_API_KEY:
                self.client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
                print(f"[Qdrant Cloud] Successfully connected to Qdrant Cloud at {QDRANT_URL}")
            else:
                self.client = QdrantClient(path="/home/mahesh/project/UPSC/backend/qdrant_db")
                print(f"[Qdrant Local] Initialized local storage.")
        except Exception as e:
            print(f"[Qdrant] Connection warning: {e}. Falling back to local storage.")
            self.client = QdrantClient(path="/home/mahesh/project/UPSC/backend/qdrant_db")

        self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                )
                print(f"[Qdrant] Collection '{self.collection_name}' created.")
        except Exception as e:
            print(f"[Qdrant] Collection check error: {e}")

    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        try:
            points = []
            for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
                points.append(
                    PointStruct(
                        id=idx + 1,
                        vector=vector,
                        payload=chunk
                    )
                )
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            print(f"[Qdrant] Upserted {len(points)} vector points to collection.")
        except Exception as e:
            print(f"[Qdrant Error] Failed to upsert: {e}")

    def search_similar(self, query_vector: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit
            )
            return [hit.payload for hit in results]
        except Exception as e:
            print(f"[Qdrant Error] Search error: {e}")
            return []

qdrant_service = QdrantService()
