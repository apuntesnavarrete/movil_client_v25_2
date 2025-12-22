import { View, Text } from 'react-native';
import { RootStackParamList } from './src/navigation/types';
import { RouteProp } from '@react-navigation/native';

type GolesRouteProp = RouteProp<RootStackParamList, 'Goles'>;


export default function Goles({ route }: { route: GolesRouteProp }) {
      const { team, partidoId, torneoId } = route.params;

   return (
    <View>
      <Text>Goles</Text>
      <Text>Team: {team}</Text>
      <Text>Partido ID: {partidoId}</Text>
      <Text>Torneo ID: {torneoId}</Text>
    </View>
  );
}
