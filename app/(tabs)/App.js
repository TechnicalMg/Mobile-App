<<<<<<< HEAD
import React from 'react';
import { AuthProvider } from './authContext';
import AppNavigator from './AppNavigator';  // Path might need adjustment

const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
=======
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from './utils/notifications'; // adjust path if needed

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="DashboardScreen" options={{ title: 'Dashboard' }} />
    </Stack>
  );
}
>>>>>>> 4000beeff4c693dae137a8e219e9a022a1e5920a
