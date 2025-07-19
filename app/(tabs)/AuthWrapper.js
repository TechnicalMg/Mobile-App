// AuthWrapper.js (React Navigation version)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

export default function AuthWrapper({ children }) {
    const navigation = useNavigation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) {
                    navigation.replace('Login'); // 👈 must match your Stack.Screen name
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                navigation.replace('Login');
            }
        };

        checkAuth();
    }, []);

    return children;
}
