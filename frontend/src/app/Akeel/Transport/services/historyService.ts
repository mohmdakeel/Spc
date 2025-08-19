export interface HistoryItem {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: number | string;
  previousData: string | null; // << use previousData, not deletedData
}

// Fetch all history logs
export async function fetchAllHistory(): Promise<HistoryItem[]> {
  const res = await fetch("/api/history/all");
  if (!res.ok) throw new Error("Failed to fetch all history");
  return res.json();
}

// Fetch history for a specific entity and id
export async function fetchHistoryByEntity(entityType: string, entityId: string): Promise<HistoryItem[]> {
  const res = await fetch(`/api/history/${entityType}/${entityId}`);
  if (!res.ok) throw new Error("Failed to fetch history for entity");
  return res.json();
}
