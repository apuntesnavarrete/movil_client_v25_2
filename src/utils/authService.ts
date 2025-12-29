import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';

export async function onlineLogin(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function offlineLogin(username: string) {
  const storedUser = await AsyncStorage.getItem('offlineUser');
  if (!storedUser) return false;
  return JSON.parse(storedUser).username === username;
}
