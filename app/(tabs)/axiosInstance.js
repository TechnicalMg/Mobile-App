<<<<<<< HEAD
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
    baseURL: 'http://your-springboot-server:8080/api',
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Handle token expiration
            SecureStore.deleteItemAsync('authToken');
        }
        return Promise.reject(error);
    }
);

=======
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
    baseURL: 'http://your-springboot-server:8080/api',
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Handle token expiration
            SecureStore.deleteItemAsync('authToken');
        }
        return Promise.reject(error);
    }
);

>>>>>>> 4000beeff4c693dae137a8e219e9a022a1e5920a
export default api;