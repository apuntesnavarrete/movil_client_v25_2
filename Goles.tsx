import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "./src/config/config";
import { fetchWithToken } from "./src/utils/fetchWithToken";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "./src/navigation/types";


type GolesRouteProp = RouteProp<RootStackParamList, 'Planteles'>;


export default function Goles({ route }: { route: GolesRouteProp }) {
      const { team, partidoId, torneoId } = route.params;
  const [planteles, setPlanteles] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  // Teams from URL
  let teamsArray: string[] = [];
  if (typeof team === "string") teamsArray = team.split(",");
  else if (Array.isArray(team)) teamsArray = team;

  const [selectedTeam, setSelectedTeam] = useState(
    teamsArray.length > 0 ? teamsArray[0] : ""
  );

  const url = `${API_URL}/asistencias`;

  // Load data
  useEffect(() => {
    if (!torneoId) return;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setPlanteles(data);

        const firstTeam = teamsArray[0];

        if (firstTeam) {
      const filteredPlayers = data.filter(
  (p: { torneoId: number; teamName: string; partidoId: number; }) =>
    p.torneoId == Number(torneoId) &&
    p.teamName === firstTeam &&
    p.partidoId == Number(partidoId)   // add this
);
          setFiltered(filteredPlayers);
        }
      })
      .catch(console.log);
  }, [torneoId]);


  // Change team
  const changeTeam = (teamName: string) => {
    setSelectedTeam(teamName);

   const filteredPlayers = planteles.filter(
  (p: { torneoId: number; teamName: string; partidoId: number; }) =>
    p.torneoId == Number(torneoId) &&
    p.teamName === teamName &&
    p.partidoId == Number(partidoId)   // add this
);

    setFiltered(filteredPlayers);
  };


  // Change asistencia
  const toggleAsistencia = (player: any) => {
    player.asistencia = !player.asistencia;
    setFiltered([...filtered]);
  };


  // Total goals
  const totalGoals = filtered.reduce((sum, p) => sum + (Number(p.goles) || 0), 0);


const saveGoals = async () => {
  try {
    const payload = filtered.map((j) => ({
      ...j,
      partidoId: Number(partidoId),   // important
      goles: j.goles ?? 0             // avoid undefined
    }));

    console.log("Sending to backend:", payload); // debug

    const res = await fetchWithToken(`${API_URL}/asistencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    // backend returns text sometimes → force parse manually
    const text = await res.text();
    console.log("Backend response:", text);

    Alert.alert("Success", "Goals saved ✔");

  } catch (err) {
    console.error("Error saving:", err);
    Alert.alert("Error", "Saving failed ❌");
  }
};



  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      
      {/* Team selector */}
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
              borderRadius: 5
            }}
          >
            <Text style={{ color: "white" }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Players */}
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
      borderRadius: 5
    }}
  >
          <Text style={{ fontWeight: "bold" }}>
            {player.name}  #{player.dorsal}
          </Text>

          {/* Goals input */}
          <TextInput
  keyboardType="numeric"
  placeholder="Goles"
  value={String(player.goles ?? 0)}   // if undefined → 0
  onChangeText={(v) => {
    player.goles = Number(v) || 0;    // if empty or invalid → 0
    setFiltered([...filtered]);
  }}
  style={{
    borderWidth: 1,
    padding: 6,
    marginTop: 8,
    borderRadius: 5
  }}
/>

          {/* Asistencia button */}
          <TouchableOpacity
            onPress={() => toggleAsistencia(player)}
            style={{
              marginTop: 10,
              padding: 10,
              backgroundColor: "red",
              borderRadius: 5
            }}
          >
            <Text style={{ color: "white" }}>
              {player.asistencia ? "Asistencia: ✅" : "Asistencia: ❌"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      </ScrollView>

      {/* Total goals */}
      <Text style={{ fontSize: 18, marginVertical: 10 }}>
        Total goals: {totalGoals}
      </Text>

      {/* Save button */}
      <Button title="Save goals" onPress={saveGoals} />

      {/* Message */}
      {message !== "" && (
        <Text style={{ marginTop: 15, color: "green" }}>{message}</Text>
      )}
  </SafeAreaView>
  );
}