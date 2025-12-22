import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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

interface Props {
  partido: Partido;
  onSave: (p: Partido) => void;
  onEdit: (p: Partido) => void;
  onNavigate: (tipo: 'R' | 'P' | 'G', partido: Partido) => void;
}

export default function PartidoItem({ partido, onSave, onEdit, onNavigate }: Props) {
  if (!partido) {
    console.log("PARTIDO UNDEFINED inside PartidoItem");
    return null;
  }
  
  // Safe defaults: if undefined → null
  const [g1, setG1] = useState<number | null>(partido.g1 ?? null);
  const [g2, setG2] = useState<number | null>(partido.g2 ?? null);
  const [desempate, setDesempate] = useState(partido.desempate ?? '');

  const isDraw = g1 !== null && g2 !== null && g1 === g2;

  function save() {
    if (isDraw && !desempate) {
      Alert.alert('Error', 'There is a draw, select who wins desempate (L or V).');
      return;
    }

    onSave({
      ...partido,
      g1,
      g2,
      desempate: isDraw ? desempate : '',
      editando: false,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.team}>{partido.equipo1}</Text>

      {partido.editando ? (
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={g1 !== null ? g1.toString() : ''}
          onChangeText={t => setG1(t === '' ? null : Number(t))}
        />
      ) : (
        <Text style={styles.score}>{g1 ?? '-'}</Text>
      )}

      {partido.editando ? (
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={g2 !== null ? g2.toString() : ''}
          onChangeText={t => setG2(t === '' ? null : Number(t))}
        />
      ) : (
        <Text style={styles.score}>{g2 ?? '-'}</Text>
      )}

      <Text style={styles.team}>{partido.equipo2}</Text>

      <View style={{ flex: 1 }}>
        {!partido.editando && (
          <Text>
            {partido.desempate === 'L'
              ? partido.equipo1 + ' wins'
              : partido.desempate === 'V'
              ? partido.equipo2 + ' wins'
              : '-'}
          </Text>
        )}

        {partido.editando && isDraw && (
          <Picker
            selectedValue={desempate}
            onValueChange={setDesempate}
            style={{ height: 40 }}
          >
            <Picker.Item label="Select" value="" />
            <Picker.Item label={`${partido.equipo1} wins`} value="L" />
            <Picker.Item label={`${partido.equipo2} wins`} value="V" />
          </Picker>
        )}
      </View>

      <View style={styles.buttons}>
        {!partido.editando ? (
          <Button title="R" onPress={() => onEdit(partido)} />
        ) : (
          <Button title="Save" onPress={save} />
        )}
        <Button title="P" onPress={() => onNavigate('P', partido)} />
        <Button title="G" onPress={() => onNavigate('G', partido)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  team: { flex: 2, fontSize: 16 },
  score: { flex: 1, fontSize: 16, textAlign: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 4,
    marginHorizontal: 4,
    textAlign: 'center',
  },
  buttons: { flexDirection: 'row', flex: 2, justifyContent: 'space-around' },
});
