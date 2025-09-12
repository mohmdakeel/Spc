import { API_BASE, parseJson, throwHttp, unwrapApi } from './config';
import { ChangeHistory, HistoryRecordDto, ApiResponse, CompareResult } from './types';

const API = `${API_BASE}/api/history`;

function mapDtoToChangeHistory(dto: HistoryRecordDto): ChangeHistory {
  return {
    id: dto.id,
    entityType: dto.entityType as 'Vehicle' | 'Driver',
    entityId: dto.entityId,
    action: dto.action as ChangeHistory['action'],
    previousData: dto.previousJson,
    performedBy: dto.performedBy,
    timestamp: dto.timestamp,
  };
}

/** GET /api/history/recent?size=100 */
export async function fetchRecentHistory(size = 100): Promise<ChangeHistory[]> {
  const r = await fetch(`${API}/recent?size=${size}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Failed to fetch history');
  const body = (await parseJson(r)) as ApiResponse<HistoryRecordDto[]>;
  const list = body?.data ?? [];
  return list.map(mapDtoToChangeHistory);
}

/** GET /api/history/{entityType}/{entityId} */
export async function fetchTimeline(
  entityType: 'Vehicle' | 'Driver',
  entityId: string | number
): Promise<ChangeHistory[]> {
  const r = await fetch(`${API}/${entityType}/${entityId}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Failed to fetch history timeline');
  const body = (await parseJson(r)) as ApiResponse<HistoryRecordDto[]>;
  const list = body?.data ?? [];
  return list.map(mapDtoToChangeHistory);
}

/** GET /api/history/compare/{historyId} */
export async function fetchCompare(historyId: number): Promise<CompareResult> {
  const r = await fetch(`${API}/compare/${historyId}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Failed to fetch compare result');
  const body = unwrapApi<CompareResult>(await parseJson(r));
  return body;
}
