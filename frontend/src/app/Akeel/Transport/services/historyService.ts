import http, { unwrapApi } from "./http";
import { ChangeHistory, HistoryRecordDto, normalizeHistoryDto, CompareResult } from "./types";

export async function fetchRecentHistory(size = 100): Promise<ChangeHistory[]> {
  const { data } = await http.get(`/history/recent`, { params: { size } });
  const list = unwrapApi<HistoryRecordDto[]>(data);
  return list.map(normalizeHistoryDto);
}

export async function fetchTimeline(entityType: "Vehicle" | "Driver", entityId: string | number): Promise<ChangeHistory[]> {
  const { data } = await http.get(`/history/${entityType}/${entityId}`);
  const list = unwrapApi<HistoryRecordDto[]>(data);
  return list.map(normalizeHistoryDto);
}

export async function fetchCompare(historyId: number): Promise<CompareResult> {
  const { data } = await http.get(`/history/compare/${historyId}`);
  return unwrapApi<CompareResult>(data);
}
