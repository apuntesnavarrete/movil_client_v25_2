import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/config";
import { fetchWithToken } from "./fetchWithToken";
const PENDING_PLANTELES_KEY = 'pending_planteles';

export async function syncPendingPlanteles() {
  const raw = await AsyncStorage.getItem(PENDING_PLANTELES_KEY);
  if (!raw) return;
console.log("dentro de yncPendingPlanteles")
  const pending = JSON.parse(raw);
  if (pending.length === 0) return;

  const res = await fetchWithToken(`${API_URL}/asistencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pending),
  });

  if (!res.ok) return;

  await AsyncStorage.removeItem(PENDING_PLANTELES_KEY);
}