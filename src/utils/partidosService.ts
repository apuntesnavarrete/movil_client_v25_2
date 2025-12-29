import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithToken } from '../utils/fetchWithToken';
import { API_URL } from '../config/config';

const urlPartidos = `${API_URL}/partidos`;

export async function syncPendingUpdates() {
  const queueRaw = await AsyncStorage.getItem('pending_updates');
  if (!queueRaw) return;

  const queue = JSON.parse(queueRaw);

  for (const payload of queue) {
    const res = await fetchWithToken(`${urlPartidos}/${payload.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // si falla uno, NO se borra la cola
      return;
    }
  }

  // solo si TODOS fueron exitosos
  await AsyncStorage.removeItem('pending_updates');
}


export async function fetchPartidos(isOnline: boolean) {
  if (!isOnline) {
    const cached = await AsyncStorage.getItem('partidos');
        console.log("acched")

    console.log(cached)
    return cached ? JSON.parse(cached) : [];
  }
    const cached = await AsyncStorage.getItem('partidos');
    console.log("acched")
    console.log(cached)

  const res = await fetchWithToken(urlPartidos);
  const data = await res.json();
 
  return data;
}

export async function cachePartidos(data: any[]) {
  await AsyncStorage.setItem('partidos', JSON.stringify(data));
}

export async function queueOfflineUpdate(partido: any) {
  const queueRaw = await AsyncStorage.getItem('pending_updates');
  const queue = queueRaw ? JSON.parse(queueRaw) : [];
  queue.push(partido);
  await AsyncStorage.setItem('pending_updates', JSON.stringify(queue));
}
