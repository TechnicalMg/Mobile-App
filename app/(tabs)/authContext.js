// src/context/AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Application from 'expo-application';
import * as Constants from 'expo-constants';
import * as Device from 'expo-device';
import { createContext, useContext, useState } from 'react';
import { Alert, Dimensions, Platform } from 'react-native';

const AuthContext = createContext();

// ⚠️ Use LAN IP instead of localhost if testing on a real device
const BASE_URL = 'http://192.168.1.10:8080/api'; // Change to your backend IP

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // ✅ Send OTP
  const sendOtp = async (mobileNumber) => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/auth/send-otp`, { mobileNumber });

      if (response.data.message === 'OTP sent successfully') {
        setOtpSent(true);
        Alert.alert('✅ OTP Sent', 'Check your mobile for the OTP');
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      Alert.alert('❌ Error', error.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Generate unique fingerprint hash
  const generateDeviceFingerprint = () => {
    const raw = `${Device.brand}-${Device.modelName}-${Device.osName}-${Device.osVersion}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `FP-${Math.abs(hash).toString(36).toUpperCase()}`;
  };

  // ✅ Collect detailed device info
  const getDeviceInfo = () => {
    const { width, height } = Dimensions.get('window');
    return {
      brand: Device.brand || 'Unknown',
      model: Device.modelName || 'Unknown',
      deviceName: Device.deviceName || 'Unknown',
      manufacturer: Device.manufacturer || 'Unknown',
      os: `${Device.osName} ${Device.osVersion}`,
      systemVersion: Device.osVersion || 'Unknown',
      androidId: Application.androidId || 'Unavailable',
      deviceType: Device.deviceType?.toString() || 'Unknown',
      isDevice: Device.isDevice ? 'Yes' : 'No',
      memory: Device.totalMemory ? `${(Device.totalMemory / (1024 * 1024 * 1024)).toFixed(1)} GB` : 'Unknown',
      architecture: Array.isArray(Device.supportedCpuArchitectures)
        ? Device.supportedCpuArchitectures.join(', ')
        : 'Unknown',
      appVersion: Application.nativeApplicationVersion || Constants.expoConfig?.version || '1.0.0',
      buildNumber: Application.nativeBuildVersion || Constants.expoConfig?.buildNumber || '1',
      installationId: Constants.installationId || `install_${Date.now()}`,
      sessionId: `session_${Date.now().toString(36)}`,
      platform: Platform.OS,
      screenResolution: `${width}x${height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      fingerprint: generateDeviceFingerprint()
    };
  };

  // ✅ Verify OTP with device info
  const verifyOtp = async (mobileNumber, otp) => {
    try {
      setLoading(true);
      const deviceInfo = getDeviceInfo();

      const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        mobileNumber,
        otp,
        deviceInfo,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userMobile', mobileNumber);
        await AsyncStorage.setItem('lastLoginTime', new Date().toISOString());

        setUser({ mobileNumber });
        setOtpSent(false);
        Alert.alert('✅ Success', 'Logged in and device info saved!');
      } else {
        throw new Error(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      Alert.alert('❌ Invalid OTP', error.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userMobile', 'lastLoginTime']);
      setUser(null);
      setOtpSent(false);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  // ✅ Check login status
  const checkLoginStatus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await axios.get(`${BASE_URL}/auth/validate-token`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUser(response.data.user);
        } else {
          await AsyncStorage.removeItem('userToken');
        }
      }
    } catch (error) {
      console.error('Login status check failed:', error);
      await AsyncStorage.removeItem('userToken');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        otpSent,
        sendOtp,
        verifyOtp,
        logout,
        checkLoginStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook to use Auth
export const useAuth = () => useContext(AuthContext);
export { AuthContext };

