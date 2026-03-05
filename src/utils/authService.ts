import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';
import { jwtDecode } from 'jwt-decode';

type DecodedToken = {
  id: number;
  role: string;
  tournamentIds?: number[];
  exp: number;
};

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
  const storedUser = await AsyncStorage.getItem('usuario');
    console.log("usuario dentro de ofline")

  console.log(storedUser)
  const token = await AsyncStorage.getItem('accessToken');

  if (!storedUser || !token) return false;

  let decoded: DecodedToken;

  try {
    decoded = jwtDecode(token);
  } catch {
    return false;
  }

  // ⏰ token expired
  const now = Math.floor(Date.now() / 1000);
if (decoded.exp < now) {
  console.log("token expired but allowing offline access");
}
  const user = JSON.parse(storedUser);

  // minimal identity check
  return user.id === decoded.id && user.username === username;
}
