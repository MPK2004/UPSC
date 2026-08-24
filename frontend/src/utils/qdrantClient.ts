const QDRANT_URL = import.meta.env.VITE_QDRANT_URL || 'https://3475f458-eb39-407f-abdb-01fa9139d854.eu-west-2-0.aws.cloud.qdrant.io';
const QDRANT_API_KEY = import.meta.env.VITE_QDRANT_API_KEY || '';

export const searchQdrantCloud = async (collectionName: string = 'upsc_geography_environment', limit: number = 5) => {
  if (!QDRANT_API_KEY) return [];

  try {
    const response = await fetch(`${QDRANT_URL}/collections/${collectionName}/points/scroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': QDRANT_API_KEY
      },
      body: JSON.stringify({
        limit: limit,
        with_payload: true
      })
    });
    if (response.ok) {
      const data = await response.json();
      return data.result?.points || [];
    }
  } catch (e) {
    console.warn('[Qdrant Cloud Client] Search fallback:', e);
  }
  return [];
};
