import Constants from 'expo-constants';
import axios from 'axios';

const backendUrl = (Constants?.expoConfig as any)?.extra?.backendUrl || 'http://192.168.1.16:3000';

export const api = axios.create({ baseURL: backendUrl });

export function setAuthToken(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}
