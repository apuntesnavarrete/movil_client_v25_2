import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Switch, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchWithToken } from "./src/utils/fetchWithToken";
import { API_URL } from "./src/config/config";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "./src/navigation/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './src/utils/useNetworkStatus';
import { NetworkStatusMessage } from "./src/components/NetworkStatusMessage";

interface PlantelType {
  id: number;
  dorsal: string;
  participants: {
    id: any; name: string 
};
  teams: {
    id: any; name: string 
};
  teamId: number;         // ✅ added
  asistencia?: boolean;
}

type GolesRouteProp = RouteProp<RootStackParamList, 'Planteles'>;


export default function Planteles({ route }: { route: GolesRouteProp }) {
      const { team, partidoId, torneoId } = route.params;
const isOnline = useNetworkStatus();
const PENDING_PLANTELES_KEY = 'pending_planteles';
  const ASISTENCIAS_KEY = 'asistencias';

  // Teams array
  let teamsArray: string[] = [];
  if (typeof team === "string") teamsArray = team.split(",");
  else if (Array.isArray(team)) teamsArray = team;

  const [selectedTeam, setSelectedTeam] = useState(
    teamsArray.length > 0 ? teamsArray[0] : ""
  );

  const [planteles, setPlanteles] = useState<PlantelType[]>([]);
  const [filtered, setFiltered] = useState<PlantelType[]>([]);
const [nuevoJugadorNombre, setNuevoJugadorNombre] = useState("");
const [nuevoJugadorDorsal, setNuevoJugadorDorsal] = useState("");


  const url = `${API_URL}/planteles/${torneoId}`;

  // Load players
useEffect(() => {
  if (!torneoId) return;

  const loadPlanteles = async () => {
    // 1️⃣ read cache first
    const saved = await AsyncStorage.getItem('planteles_cache');
    if (saved) {
      const cached = JSON.parse(saved);
      setPlanteles(cached);

      const firstTeam = teamsArray[0];
      if (firstTeam) {
        setFiltered(
          cached.filter((p: PlantelType) => p.teams.name === firstTeam)
        );
      }
    }

    // 2️⃣ then fetch fresh data
    try {
      const res = await fetch(url);
      const data = await res.json();

      setPlanteles(data);

      const firstTeam = teamsArray[0];
      if (firstTeam) {
        setFiltered(
          data.filter((p: PlantelType) => p.teams.name === firstTeam)
        );
      }

      // 3️⃣ update cache
      await AsyncStorage.setItem(
        'planteles_cache',
        JSON.stringify(data)
      );
    } catch (err) {
      console.log(err);
    }
  };

  loadPlanteles();
}, [torneoId]);


  // Change team
  const changeTeam = (teamName: string) => {
    setSelectedTeam(teamName);

    const result = planteles.filter((p) => p.teams.name === teamName);
    setFiltered(result);
  };

  const getSelectedCount = () =>
    filtered.filter((j) => j.asistencia).length;

  const getTotal = () => filtered.length;

  // SEND attendance
 const enviarAsistencia = async () => {
  if (!selectedTeam) return;
    console.log("boton enviar asistencias")

  const asistenciaArray = filtered
      .filter((jug) => jug.asistencia)
      .map((jug) => ({
        teamId: jug.teams.id, // ✅ now exists
        teamName: selectedTeam,
        participantId: jug.participants.id,
        name: jug.participants.name,
        dorsal: jug.dorsal,
        asistencia: jug.asistencia,
        partidoId: Number(partidoId),
        torneoId: Number(torneoId),
      }));
    console.log("payload planteles")
    console.log(asistenciaArray)

 if (!isOnline) {
  // 1️⃣ queue for later sync
  const pending =
    JSON.parse((await AsyncStorage.getItem(PENDING_PLANTELES_KEY)) ?? '[]');

  await AsyncStorage.setItem(
    PENDING_PLANTELES_KEY,
    JSON.stringify([...pending, ...asistenciaArray])
  );

  // 2️⃣ update local snapshot (THIS is what Goles reads)
  const cached =
    JSON.parse((await AsyncStorage.getItem(ASISTENCIAS_KEY)) ?? '[]');

let updated = [...cached];


for (const a of asistenciaArray) {
  const index = updated.findIndex(
    p =>
      p.participantId === a.participantId &&
      p.partidoId === a.partidoId &&
      p.torneoId === a.torneoId
  );

  if (index >= 0) {
    // update existing
    updated[index] = { ...updated[index], ...a };
  } else {
    // append new
    updated.push(a);
  }
}

  
  console.log("updated planteles")
  console.log(updated)

  

  await AsyncStorage.setItem(ASISTENCIAS_KEY, JSON.stringify(updated));

  alert('Saved locally (offline)');
  return;
}


  // 🟢 ONLINE → send to backend
  await fetchWithToken(`${API_URL}/asistencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asistenciaArray),
  });

  alert('Saved online');
};





const agregarNuevoJugador = async () => {
  if (!selectedTeam || !nuevoJugadorNombre.trim() || !partidoId) return;

  // obtener teamId del plantel actual
  const equipoId =
    filtered.length > 0 ? filtered[0].teams.id : 0;

  const nuevoJugador = {
    id: Date.now(), // temporal
    participants: { id: Date.now(), name: nuevoJugadorNombre.trim() },
    dorsal: nuevoJugadorDorsal || "",
    teams: { id: equipoId, name: selectedTeam },
    teamId: equipoId,
    asistencia: true,
  };

  console.log("Nuevo jugador:", nuevoJugador);

  // agregar al estado
  setFiltered([...filtered, nuevoJugador]);

  // payload para backend
  const payload = [
    {
      teamId: equipoId,
      teamName: selectedTeam,
      participantId: nuevoJugador.participants.id,
      name: nuevoJugador.participants.name,
      dorsal: nuevoJugador.dorsal,
      asistencia: true,
      partidoId: Number(partidoId),
      torneoId: Number(torneoId),
    },
  ];

// ✅ OFFLINE: do NOT call backend
  if (!isOnline) {
    alert(
      `Player "${nuevoJugador.participants.name}" saved to cache (offline)`
    );

    setNuevoJugadorNombre("");
    setNuevoJugadorDorsal("");
    return;
  }


  // 🟢 ONLINE: normal backend call
  try {
    await fetchWithToken(`${API_URL}/asistencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert(
      `New player "${nuevoJugador.participants.name}" added to ${selectedTeam}`
    );

    setNuevoJugadorNombre("");
    setNuevoJugadorDorsal("");
  } catch (err) {
    console.error(err);
    alert("Error adding new player");
  }
};


 return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
          <NetworkStatusMessage></NetworkStatusMessage>


    {/* SELECT TEAM */}
    <Text style={{ fontSize: 20, fontWeight: "bold" }}>Choose team</Text>

    <View style={{ flexDirection: "row", marginVertical: 10, flexWrap: "wrap" }}>
      {teamsArray.map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => changeTeam(t)}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: t === selectedTeam ? "#ccc" : "#eee",
            marginRight: 6,
            marginBottom: 6,
            borderRadius: 4,
          }}
        >
          <Text>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* PLAYER LIST */}
    {selectedTeam !== "" && (
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
          {selectedTeam}
        </Text>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          style={{ maxHeight: "50%" }}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 6,
                padding: 10,
                backgroundColor: item.asistencia ? "#d0ffd0" : "#f5f5f5",
                borderRadius: 5,
              }}
            >
              <Switch
                value={item.asistencia || false}
                onValueChange={(value) => {
                  item.asistencia = value;
                  setFiltered([...filtered]);
                }}
              />

              <Text style={{ marginLeft: 10, flexShrink: 1 }}>
                {item.participants.name} — #{item.dorsal}
              </Text>
            </View>
          )}
        />

        {/* NEW PLAYER FORM */}
        <Text style={{ fontWeight: "bold", marginTop: 10 }}>
          Add new player
        </Text>

        <View style={{ marginTop: 8 }}>
          <Text>Name:</Text>
          <TextInput
            value={nuevoJugadorNombre}
            onChangeText={setNuevoJugadorNombre}
            placeholder="Player name"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 5,
              marginBottom: 8,
            }}
          />

          <Text>Dorsal:</Text>
          <TextInput
            value={nuevoJugadorDorsal}
            onChangeText={setNuevoJugadorDorsal}
            placeholder="Number"
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 5,
              marginBottom: 12,
            }}
          />

          <TouchableOpacity
            onPress={agregarNuevoJugador}
            style={{
              backgroundColor: "green",
              padding: 10,
              borderRadius: 5,
              marginBottom: 15,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Add Player
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEND ATTENDANCE */}
        <Text style={{ marginTop: 10, fontWeight: "bold" }}>
          Selected: {getSelectedCount()} / {getTotal()}
        </Text>

        <TouchableOpacity
          onPress={enviarAsistencia}
          style={{
            backgroundColor: "#007bff",
            padding: 12,
            marginTop: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
    )}
  </SafeAreaView>
);

}
