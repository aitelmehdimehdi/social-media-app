import { Platform } from 'react-native';

function getApiUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  if (Platform.OS === 'android') return 'http://192.168.7.10:3000/api';
  return 'http://192.168.7.10:3000/api';
}

export const API_URL = getApiUrl();
