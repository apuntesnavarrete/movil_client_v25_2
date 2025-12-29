import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import PartidoItem from './PartidoItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';
import { useNetworkStatus } from './src/utils/useNetworkStatus';
import { cachePartidos, fetchPartidos, queueOfflineUpdate, syncPendingUpdates } from './src/utils/partidosService';
import { filterPartidos } from './src/utils/partidosFilter';
import { NetworkStatusMessage } from './src/components/NetworkStatusMessage';
import { API_URL } from './src/config/config';
import { fetchWithToken } from './src/utils/fetchWithToken';


interface Partido {
  torneoId: number;
  id: number;
  equipo1: string;
  equipo2: string;
  g1?: number | null;
  g2?: number | null;
  desempate: string;
  editando: boolean;
  liga: number;
  categoria: number;
  dia: string;
}

const diasDisponibles = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

type Props = NativeStackScreenProps<RootStackParamList, 'TrabajoDiario'>;


export default function TrabajoDiario({ navigation }: Props) {
 const isOnline = useNetworkStatus();

  const [diaSeleccionado, setDiaSeleccionado] = useState(diasDisponibles[new Date().getDay()]);
  const [usuario] = useState('pro'); // replace with real auth
const [trabajos, setTrabajos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = API_URL; // Replace with your API URL

const urlPartidos = baseUrl + '/partidos';

  useEffect(() => {
       cargarTrabajos();
  }, [diaSeleccionado, usuario, isOnline]);

  useEffect(() => {
    if (isOnline) syncPendingUpdates();
  }, [isOnline]);



  async function cargarTrabajos() {
    setLoading(true);
    try {
      const data = await fetchPartidos(isOnline);

if (isOnline) {
  await cachePartidos(data);
} 

      const preparados = filterPartidos(data, usuario, diaSeleccionado);
      setTrabajos(preparados);
   } catch {
      Alert.alert('Error', 'Failed to load partidos');
    } finally {
      setLoading(false);
    }
  }

async function guardarGoles(partido: Partido) {

   if (partido.g1 === partido.g2 && !partido.desempate) {
      Alert.alert('Error', 'There is a draw, select who wins desempate (L or V).');
      return;
    }

  const updated = trabajos.map(t =>
    t.id === partido.id ? { ...partido, editando: false } : t
  );

  setTrabajos(updated);
  await cachePartidos(updated);


const payload = {
      id: partido.id,
      equipo1: partido.equipo1,
      equipo2: partido.equipo2,
      g1: partido.g1 != null ? Number(partido.g1) : null,
      g2: partido.g2 != null ? Number(partido.g2) : null,
      desempate: partido.desempate ?? '',
      liga: partido.liga,
      categoria: partido.categoria,
      dia: partido.dia,
      torneoId: partido.torneoId,
    }

  if (isOnline) {

  fetchWithToken(`${urlPartidos}/${partido.id}`, {
  method: "PUT",
  body: JSON.stringify(payload),
})
      .then(() => console.log('Partido updated ✅'))
      .catch(err => console.error('Error saving partido:', err));
  


  } else {
    await queueOfflineUpdate(payload);
    console.log('Offline update queued:', partido.id);
  }
    
}


function iniciarEdicion(partido: Partido) {
  console.log("boton r")
  setTrabajos(trabajos.map(t =>
    t.id === partido.id ? { ...t, editando: true } : t
  ));
}

function accion(tipo: 'R' | 'P' | 'G', partido: Partido) {
  const equipos = [partido.equipo1, partido.equipo2].join(',');

 if (tipo === 'R') iniciarEdicion(partido);

  if (tipo === 'P') {
    navigation.navigate('Planteles', {
      team: equipos,
      partidoId: partido.id,
      torneoId: partido.torneoId,
    });
  }

  if (tipo === 'G') {
    navigation.navigate('Goles', {
      team: equipos,
      partidoId: partido.id,
      torneoId: partido.torneoId,
    });
  }
}
 return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
    <NetworkStatusMessage></NetworkStatusMessage>

        <Text style={styles.title}>
          Trabajo del día: {diaSeleccionado.charAt(0).toUpperCase() + diaSeleccionado.slice(1)}
        </Text>

        <Picker
          selectedValue={diaSeleccionado}
          onValueChange={setDiaSeleccionado}
          style={styles.picker}
        >
          {diasDisponibles.map(d => (
            <Picker.Item key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} value={d} />
          ))}
        </Picker>

        {loading ? (
          <Text>Loading...</Text>
        ) : trabajos.length === 0 ? (
          <Text>No hay trabajo programado para este día.</Text>
        ) : (
       <FlatList
  data={trabajos}
  keyExtractor={item => item.id.toString()}
  renderItem={({ item }) => (
    <PartidoItem
      partido={item}
      onSave={guardarGoles}
      onEdit={iniciarEdicion}
      onNavigate={accion}
    />
  )}
/>

        )}

        <View style={styles.footerInfo}>
          <Text style={styles.footerTitle}>Descripción de los botones</Text>
          <Text>R → resultados</Text>
          <Text>P → agregar planteles</Text>
          <Text>G → agregar goles</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff' // helps avoid color bleed behind system bars
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  title: {
    fontSize: 20,
    marginVertical: 10
  },
  picker: {
    height: 50,
    width: 200
  },
  actions: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'space-between'
  },
  listContent: {
    paddingBottom: 80 // prevents last item from being hidden behind bottom bar
  },
  footerInfo: {
    marginTop: 20
  },
  footerTitle: {
    fontWeight: 'bold'
  }
});
