import axios from 'axios';

/**
 * Shared Axios client for API requests.
 * Centralizes the base URL and attaches the auth token for every request.
 *
 * @type {import('axios').AxiosInstance}
 */
const client = axios.create({ baseURL: '/api' });

/**
 * Adds the stored authentication token to outgoing requests when available.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - The request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} The updated request config.
 */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('adg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;