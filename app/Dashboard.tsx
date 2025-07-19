import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem('token');
      if (!savedToken) {
        router.replace('/LoginScreen');
      } else {
        setToken(savedToken);
      }
    };
    loadToken();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/LoginScreen');
  };

  return (
    <View style={styles.container}>
      <Text>Welcome to Dashboard</Text>
      <Text style={styles.token}>{token}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  token: { marginVertical: 20, fontSize: 12, color: '#555' },
});
