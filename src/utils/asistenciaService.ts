// src/utils/asistenciasService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';
import { fetchWithToken } from './fetchWithToken';

const ASISTENCIAS_KEY = 'asistencias';
const PENDING_GOALS_KEY = 'pending_goals';

export async function syncPendingUpdatesAsistencias() {
  const queueRaw = await AsyncStorage.getItem(PENDING_GOALS_KEY);
  console.log("usando la funcion")
  if (!queueRaw) return;

  const asistenciasRaw = await AsyncStorage.getItem(ASISTENCIAS_KEY);
  if (!asistenciasRaw) return;

  const queue = JSON.parse(queueRaw);
  const asistencias = JSON.parse(asistenciasRaw);

const map = new Map<string, any>();

for (const q of queue) {
  const key = `${q.participantId}-${q.partidoId}-${q.torneoId}-${q.field}`;
  map.set(key, q);
}

const consolidatedQueue = Array.from(map.values());
  console.log("consolidatedQueue")

  console.log(consolidatedQueue)

  // aplicar cambios pendientes al snapshot completo
  const updated = asistencias.map((p: any) => {
    const hit = consolidatedQueue.find(
      (q: any) =>
        q.participantId === p.participantId &&
        q.partidoId === p.partidoId &&
        q.torneoId === p.torneoId
    );

    if (!hit) return p;

    return { ...p, [hit.field]: hit.value };
  });

  const res = await fetchWithToken(`${API_URL}/asistencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });

  if (!res.ok) return;

  const fresh = await fetchWithToken(`${API_URL}/asistencias`).then(r => r.json());

  await AsyncStorage.setItem(ASISTENCIAS_KEY, JSON.stringify(fresh));
  await AsyncStorage.removeItem(PENDING_GOALS_KEY);
}
