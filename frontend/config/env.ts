import { Platform } from 'react-native';

function getApiUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  return 'http://192.168.11.102:3000/api';
}

export const API_URL = getApiUrl();
export const SOCKET_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.11.102:3000';
