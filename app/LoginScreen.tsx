import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function OtpScreen() {
  const [otp, setOtp] = useState('');
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();

  const verifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8080/api/auth/verify-otp', {
        mobile,
        otp: otp.trim(),
      });

      const responseText = res.data;

      if (res.status === 401 || responseText.includes('❌')) {
        Alert.alert('Error', 'Incorrect OTP');
        return;
      }

      const token = responseText.replace('✅', '').trim(); // Remove emoji prefix
      await AsyncStorage.setItem('token', token);
      router.replace('/Dashboard');
    } catch (err) {
      console.error('OTP verification error:', err);
      Alert.alert('Error', 'OTP verification failed. Make sure backend is running.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter OTP sent to {mobile}</Text>
      <TextInput
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        placeholder="e.g. 1234"
        maxLength={6}
        style={styles.input}
      />
      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 100,
    backgroundColor: '#fff',
    flex: 1,
  },
  label: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    fontSize: 16,
  },
});
