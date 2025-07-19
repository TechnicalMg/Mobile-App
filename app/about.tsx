// app/About.tsx
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

const About = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email && password) {
      Alert.alert('Logging in with:', `Email: ${email}\nPassword: ${password}`);
      // You can replace this with a real login API call
    } else {
      Alert.alert('Please enter both email and password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About Page</Text>
      <Text style={styles.subtitle}>This app is for mobile OTP login</Text>

      {/* Email & Password Login UI */}
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />

      <Link href="/LoginScreen">
        <Text style={styles.link}>Back to Login</Text>
      </Link>
    </View>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20
  },
  title: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 10
  },
  subtitle: {
    fontSize: 16, marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#000', // <-- user input text color (darker for better visibility)
    width: '100%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  link: {
    color: 'blue', fontSize: 18, marginTop: 20
  },
});
