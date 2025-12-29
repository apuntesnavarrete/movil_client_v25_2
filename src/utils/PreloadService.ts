import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';

const TORNEOS_BY_ROLE: Record<string, number[]> = {
  pro: [47, 39],
  ed: [19, 21],
};

export async function preloadPlanteles(role: string) {
  const torneoIds = TORNEOS_BY_ROLE[role] || [];
  const requests = torneoIds.map(id =>
    fetch(`${API_URL}/planteles/${id}`).then(r => r.json())
  );
  const results = await Promise.all(requests);
  await AsyncStorage.setItem('planteles_cache', JSON.stringify(results.flat()));
}

export async function preloadCoreData() {
  const [partidos, asistencias] = await Promise.all([
    fetch(`${API_URL}/partidos`).then(r => r.json()),
    fetch(`${API_URL}/asistencias`).then(r => r.json()),
  ]);

  await AsyncStorage.multiSet([
    ['partidos', JSON.stringify(partidos)],
    ['asistencias', JSON.stringify(asistencias)],
  ]);
/*
console.log(
  'PARTIDOS STORED:',
  await AsyncStorage.getItem('partidos')
);

console.log(
  'ASISTENCIAS STORED:',
  await AsyncStorage.getItem('asistencias')
);
*/
}
