import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Button, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from "./src/config/config";
import { fetchWithToken } from "./src/utils/fetchWithToken";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "./src/navigation/types";
import { useNetworkStatus } from './src/utils/useNetworkStatus';
import { NetworkStatusMessage } from "./src/components/NetworkStatusMessage";

type GolesRouteProp = RouteProp<RootStackParamList, 'Planteles'>;

export default function Goles({ route }: { route: GolesRouteProp }) {
  const { team, partidoId, torneoId } = route.params;
  const isOnline = useNetworkStatus();
const hasSyncedRef = useRef(false);

  const [planteles, setPlanteles] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  // Equipos desde URL
  let teamsArray: string[] = [];
  if (typeof team === "string") teamsArray = team.split(",");
  else if (Array.isArray(team)) teamsArray = team;

  const [selectedTeam, setSelectedTeam] = useState(
    teamsArray.length > 0 ? teamsArray[0] : ""
  );

  const ASISTENCIAS_KEY = 'asistencias';
  const PENDING_GOALS_KEY = 'pending_goals';

  // Función para cargar asistencias (online o offline)
  const loadAsistencias = async () => {
    if (isOnline) {
      try {
        const res = await fetchWithToken(`${API_URL}/asistencias`);
        const data = await res.json();
        setPlanteles(data);
        console.log("ultimo de las asistencias ");

console.log(data[data.length - 1]);
        await AsyncStorage.setItem(ASISTENCIAS_KEY, JSON.stringify(data));
        filterByTeam(data, selectedTeam);
      } catch (e) {
        console.error("Error fetching asistencias online:", e);
        // Si falla fetch, intentar cargar caché
        loadFromCache();
      }
    } else {
      loadFromCache();
    }
  };

  // Cargar datos del cache
  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(ASISTENCIAS_KEY);
      const data = cached ? JSON.parse(cached) : [];
      setPlanteles(data);
      filterByTeam(data, selectedTeam);
    } catch (e) {
      console.error("Error loading asistencias from cache:", e);
      setPlanteles([]);
      setFiltered([]);
    }
  };

  // Filtrar jugadores por equipo
  const filterByTeam = (data: any[], teamName: string) => {
    const filteredPlayers = data.filter(
      (p) =>
        p.torneoId == Number(torneoId) &&
        p.teamName === teamName &&
        p.partidoId == Number(partidoId)
    );
    setFiltered(filteredPlayers);
  };

  useEffect(() => {
    if (!torneoId) return;
    loadAsistencias();
  }, [torneoId, selectedTeam, isOnline]);

  // Cambiar equipo
  const changeTeam = (teamName: string) => {
    setSelectedTeam(teamName);
    filterByTeam(planteles, teamName);
  };

  // Cambiar asistencia o goles
  const updatePlayer = async (playerId: number, field: 'asistencia' | 'goles', value: any) => {
    const updated = filtered.map((p) => {
     if (
  p.participantId === playerId &&
  p.partidoId === Number(partidoId) &&
  p.torneoId === Number(torneoId)
) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setFiltered(updated);

    // Actualizar cache local completa
   const updatedAll = planteles.map((p) => {
  if (
    p.participantId === playerId &&
    p.partidoId === Number(partidoId) &&
    p.torneoId === Number(torneoId)
  ) {
    return { ...p, [field]: value };
  }
  return p;
});
    setPlanteles(updatedAll);
    await AsyncStorage.setItem(ASISTENCIAS_KEY, JSON.stringify(updatedAll));

    // Si estamos offline, agregar a la cola pendiente para enviar después
    if (!isOnline) {
      await queuePendingUpdate(playerId, field, value);
    }
  };

  // Agregar cambio pendiente para sincronizar luego
  const queuePendingUpdate = async (playerId: number, field: string, value: any) => {
    try {
      const queueRaw = await AsyncStorage.getItem(PENDING_GOALS_KEY);
      const queue = queueRaw ? JSON.parse(queueRaw) : [];
      // Guardar solo el cambio necesario
      queue.push({ participantId: playerId, field, value, partidoId, torneoId });
      await AsyncStorage.setItem(PENDING_GOALS_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Error queueing pending update:", e);
    }
  };

  // Sincronizar cambios pendientes cuando volvemos online
const syncPendingUpdates = async () => {
  if (!isOnline) return;

  try {
    const queueRaw = await AsyncStorage.getItem(PENDING_GOALS_KEY);

    if (!queueRaw) return;

    const queue = JSON.parse(queueRaw);

    // 🔹 Consolidar por participantId + field
    const map = new Map<string, any>();

    for (const update of queue) {
const key = `${update.participantId}-${update.partidoId}-${update.field}`;
      map.set(key, {
        participantId: update.participantId,
        [update.field]: update.value,
        partidoId: update.partidoId,
        torneoId: update.torneoId,
      });
    }

const payload = planteles
  .filter(p =>
    p.partidoId === Number(partidoId) &&
    p.torneoId === Number(torneoId)
  )
  .map(p => ({
    ...p,
    partidoId: Number(partidoId),
  }));

    //console.log("SYNC PAYLOAD (consolidado) →", payload);

    const response = await fetchWithToken(`${API_URL}/asistencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

 //   console.log("SYNC STATUS →", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SYNC ERROR →", errorText);
      return; // ❗ no borrar cache si falla
    }

    const data = await response.json();
   // console.log("SYNC SUCCESS pre load →", data);


    // 🔴 IMPORTANT: reload fresh data AFTER sync
await loadAsistencias();


    await AsyncStorage.removeItem(PENDING_GOALS_KEY);
   // console.log("SYNC DONE → keeping local state");

  } catch (e) {
    console.error("Error syncing pending updates:", e);
  }
};


  // Detectar reconexión para sincronizar
 useEffect(() => {
  if (isOnline && !hasSyncedRef.current) {
    hasSyncedRef.current = true;
    console.log("ONLINE → syncing pending updates ");
    syncPendingUpdates();
    console.log("ONLINE → syncing pending echo ");

  }

  if (!isOnline) {
    hasSyncedRef.current = false; // reset when offline again
  }
}, [isOnline]);

  // Total de goles
  const totalGoals = filtered.reduce((sum, p) => sum + (Number(p.goles) || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      {/* Selector de equipo */}
          <NetworkStatusMessage></NetworkStatusMessage>
      
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Select team:</Text>
      <View style={{ flexDirection: "row", marginVertical: 10 }}>
        {teamsArray.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => changeTeam(t)}
            style={{
              padding: 10,
              backgroundColor: selectedTeam === t ? "blue" : "gray",
              marginRight: 10,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: "white" }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de jugadores */}
      <Text style={{ fontSize: 20, marginBottom: 10 }}>
        Players of {selectedTeam}
      </Text>
      <ScrollView style={{ maxHeight: 400, marginBottom: 20 }}>
        {filtered.map((player, i) => (
          <View
            key={`${player.participantId}-${i}`}
            style={{
              marginBottom: 15,
              padding: 10,
              borderWidth: 1,
              borderRadius: 5,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {player.name} #{player.dorsal}
            </Text>

            {/* Input goles */}
            <TextInput
              keyboardType="numeric"
              placeholder="Goles"
              value={String(player.goles ?? 0)}
              onChangeText={(v) =>
                updatePlayer(player.participantId, 'goles', Number(v) || 0)
              }
              style={{
                borderWidth: 1,
                padding: 6,
                marginTop: 8,
                borderRadius: 5,
              }}
            />

            {/* Botón asistencia */}
            <TouchableOpacity
              onPress={() =>
                updatePlayer(player.participantId, 'asistencia', !player.asistencia)
              }
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: "red",
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "white" }}>
                {player.asistencia ? "Asistencia: ✅" : "Asistencia: ❌"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Total goles */}
      <Text style={{ fontSize: 18, marginVertical: 10 }}>
        Total goals: {totalGoals}
      </Text>

      {/* Botón guardar */}
      <Button title="Save goals" onPress={saveGoals} />

      {/* Mensaje */}
      {message !== "" && <Text style={{ marginTop: 15, color: "green" }}>{message}</Text>}
    </SafeAreaView>
  );

  // Guardar en backend (función existente)
  async function saveGoals() {
/*
      if (!isOnline) {
    for (const player of filtered) {
      await queuePendingUpdate(
        player.participantId,
        'goles',
        player.goles ?? 0
      );
    }


    setMessage("Saved locally. Will sync when online.");
    return;
  }
*/

    try {
      const payload = filtered.map((j) => ({
        ...j,
        partidoId: Number(partidoId),
        goles: j.goles ?? 0,
      }));

      const res = await fetchWithToken(`${API_URL}/asistencias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      setMessage("Goals saved ✔");
      Alert.alert("Success", "Goals saved ✔");
    } catch (err) {
      console.error("Error saving:", err);
      setMessage("Saving failed ❌");
      Alert.alert("Error", "Saving failed ❌");
    }
  }
}
