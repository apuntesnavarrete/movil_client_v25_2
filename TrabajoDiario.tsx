import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithToken } from './src/utils/fetchWithToken';
import { API_URL } from './src/config/config';
import PartidoItem from './PartidoItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';

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

// Dummy Auth and API for demo purposes
const auth = {
  getUser: () => ({ role: 'pro' }),
  logout: () => {},
};

const baseUrl = API_URL; // Replace with your API URL
const urlPartidos = baseUrl + '/partidos';

type Props = NativeStackScreenProps<RootStackParamList, 'TrabajoDiario'>;


export default function TrabajoDiario({ navigation }: Props) {
  const [diaSeleccionado, setDiaSeleccionado] = useState(diasDisponibles[new Date().getDay()]);
  const [usuario, setUsuario] = useState('invitado');
  const [trabajos, setTrabajos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.getUser();
    console.log(user)
    setUsuario(user ? user.role : 'invitado');
    console.log(user)
  }, []);

  useEffect(() => {
    cargarTrabajos();
  }, [diaSeleccionado, usuario]);

  function cargarTrabajos() {
            console.log(urlPartidos)

    setLoading(true);
   fetchWithToken(urlPartidos)
  .then(res => res.json())
      .then((data: Partido[]) => {
        let partidosFiltrados = data;
                console.log(usuario)

        if (usuario === 'pro') {
          partidosFiltrados = partidosFiltrados.filter(p => [47, 39].includes(p.torneoId));
    


        } else if (usuario === 'ed') {
          partidosFiltrados = partidosFiltrados.filter(p => [42].includes(p.torneoId));
    
              console.log("revisar filtardo ed")
                console.log(partidosFiltrados)
    
        }

        partidosFiltrados = partidosFiltrados.filter(p => p.dia === diaSeleccionado);

        const trabajosPreparados = partidosFiltrados.map(p => ({
          ...p,
          g1: p.g1 ?? null,
          g2: p.g2 ?? null,
          desempate: p.desempate ?? '',
          editando: false,
        }));

        setTrabajos(trabajosPreparados);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load partidos');
        setTrabajos([]);
        setLoading(false);
      });
  }

  function guardarGoles(partido: Partido) {
    if (partido.g1 === partido.g2 && !partido.desempate) {
      Alert.alert('Error', 'There is a draw, select who wins desempate (L or V).');
      return;
    }
    const updated = trabajos.map(t =>
      t.id === partido.id ? { ...partido, editando: false } : t
    );
    setTrabajos(updated);

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
    };

  fetchWithToken(`${urlPartidos}/${partido.id}`, {
  method: "PUT",
  body: JSON.stringify(payload),
})
      .then(() => console.log('Partido updated ✅'))
      .catch(err => console.error('Error saving partido:', err));
  }

  function iniciarEdicion(partido: Partido) {
    setTrabajos(trabajos.map(t => (t.id === partido.id ? { ...t, editando: true } : t)));
  }

  function accion(tipo: 'R' | 'P' | 'G', partido: Partido) {
    if (tipo === 'R') iniciarEdicion(partido);

  if (tipo === 'P') {
  const equipos = [partido.equipo1, partido.equipo2].join(',');


        navigation.navigate('Planteles', {
 team: equipos,          // send both teams
      partidoId: partido.id,  // match id
      torneoId: partido.torneoId
});
  /*
  router.push({
    pathname: "/Planteles",
    params: { 
      team: equipos,          // send both teams
      partidoId: partido.id,  // match id
      torneoId: partido.torneoId
    }
  });
*/

    }

    if (tipo === 'G') {
        const equipos = [partido.equipo1, partido.equipo2].join(',');

navigation.navigate('Goles', {
 team: equipos,          // send both teams
      partidoId: partido.id,  // match id
      torneoId: partido.torneoId
});
/*
       router.push({
    pathname: "/Goles",
    params: { 
            team: equipos,          // send both teams

      partidoId: partido.id,  // match id
      torneoId: partido.torneoId
    }
  });
*/

    }

     
  }

  function guardarEnServidor() {
    const payload = trabajos.map(p => ({
      id: p.id,
      equipo1: p.equipo1,
      equipo2: p.equipo2,
      g1: p.g1 != null ? Number(p.g1) : null,
      g2: p.g2 != null ? Number(p.g2) : null,
      desempate: p.desempate ?? '',
      liga: p.liga,
      categoria: p.categoria,
      dia: p.dia,
      torneoId: p.torneoId,
    }));

  fetchWithToken(urlPartidos, {
  method: "POST",
  body: JSON.stringify(payload),
})
      .then(() => Alert.alert('Success', 'Data saved on server ✅'))
      .catch(err => console.error('Error saving data:', err));
  }

  function logout() {
    auth.logout();
    Alert.alert('Logout', 'You have been logged out');
    // Navigate to login screen if using React Navigation
  }

 return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Button title="Logout" onPress={logout} />

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

        <View style={styles.actions}>
          <Button title="Guardar en servidor" onPress={guardarEnServidor} />
        </View>

        {loading ? (
          <Text>Loading...</Text>
        ) : trabajos.length === 0 ? (
          <Text>No hay trabajo programado para este día.</Text>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
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
