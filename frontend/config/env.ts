import { Platform } from 'react-native';

function getApiUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  return 'http://192.168.11.102:3000/api'; // PC local IP — works for iOS + Android physical devices
}

export const API_URL = getApiUrl();
