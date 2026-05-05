import Constants from 'expo-constants';

function getApiUrl(): string {
  if (!__DEV__) {
    // Production build — replace with your deployed API URL
    return 'https://your-api.example.com/api';
  }

  // Expo exposes the Metro bundler host as `host:port`.
  // Splitting on ':' gives the machine IP that is running `npx expo start`.
  // This works on any machine without any manual configuration.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000/api`;
  }

  // Last-resort fallback for simulators
  return 'http://localhost:3000/api';
}

export const API_URL = getApiUrl();
