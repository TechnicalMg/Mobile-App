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
      Alert.alert('Error', 'Enter OTP');
      return;
    }

    try {
      const res = await axios.post('http://YOUR-IP:8080/api/auth/verify-otp', {
        mobile,
        otp: otp.trim(),
      });

      const token = res.data.replace('✅', '').trim();
      await AsyncStorage.setItem('token', token);
      router.replace('/Dashboard');
    } catch (err) {
      Alert.alert('Error', 'Invalid OTP or server issue');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Enter OTP sent to {mobile}</Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        placeholder="1234"
        keyboardType="number-pad"
        style={styles.input}
      />
      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: {
    borderWidth: 1, padding: 10, marginVertical: 15, borderRadius: 5,
  },
});
