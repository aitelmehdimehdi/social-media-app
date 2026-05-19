import { Platform } from 'react-native';

function getApiUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  // Update this IP to match your machine's current local network IP
  if (Platform.OS === 'ios') return 'http://100.103.123.92:3000/api';
  return 'http://100.103.123.92:3000/api';
}

export const API_URL = getApiUrl();
