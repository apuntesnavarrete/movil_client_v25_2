import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import HomeScreen from './HomeScreen';
import 'react-native-screens';

import { enableScreens } from 'react-native-screens';
import { RootStackParamList } from './src/navigation/types';
enableScreens();



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
  <NavigationContainer>
    <Stack.Navigator
      id="RootStack"
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

}
