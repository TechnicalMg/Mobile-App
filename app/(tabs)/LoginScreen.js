import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_BASE_URL = 'http://172.16.1.49:8080/api/auth';

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
    
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        router.replace('/DashboardScreen');
      }
    } catch (error) {
      console.log('No existing auth token found');
    }
  };

  useEffect(() => {
    const prepareNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable notifications to receive OTP.');
      }
    };
    prepareNotifications();
  }, []);

  const sendOtpNotification = async (otpValue) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📩 Your OTP',
        body: `Your verification code is: ${otpValue}`,
        sound: true,
      },
      trigger: null,
    });
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      Alert.alert('Invalid Input', 'Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/send-otp`, {
        mobileNumber,
      });

      if (response.status === 200) {
        const receivedOtp = response.data.otp;
        setShowOtpField(true);
        Alert.alert('Success', 'OTP sent to your mobile number.');

        if (receivedOtp) {
          setTimeout(() => {
            setOtp(receivedOtp);
            sendOtpNotification(receivedOtp);
            handleVerifyOtp(receivedOtp);
          }, 500);
        }
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to send OTP. Try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (providedOtp) => {
    const finalOtp = providedOtp || otp;

    if (!/^\d{6}$/.test(finalOtp)) {
      Alert.alert('Invalid Input', 'Enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        mobileNumber,
        otp: finalOtp,
      });

      const { token } = response.data;
      
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userMobile', mobileNumber);
      
      const loginTime = new Date().toISOString();
      await SecureStore.setItemAsync('lastLoginTime', loginTime);

      Alert.alert('Success', 'OTP verified. Logged in!');
      router.replace('/DashboardScreen');
    } catch (error) {
      const message =
        error.response?.data?.message || 'OTP verification failed.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.innerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Image
        source={require('../../assets/images/download.jpg')}  // Notice the double ../../
        style={styles.logo}
        resizeMode="contain"
      />
        
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login with your mobile number</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            maxLength={10}
          />
        </View>

        {showOtpField && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (loading || (!mobileNumber || (showOtpField && !otp))) && styles.disabled
          ]}
          onPress={!showOtpField ? handleSendOtp : handleVerifyOtp}
          disabled={loading || (!mobileNumber || (showOtpField && !otp))}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? (
              <Text>Processing...</Text>
            ) : !showOtpField ? (
              <Text>Send OTP</Text>
            ) : (
              <Text>Verify OTP</Text>
            )}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>By continuing, you agree to our</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  // Corrected logo style (merged duplicate)
  logo: {
    width: 600, // Reduced from 600 for better mobile display
    height: 300, // Reduced proportionally (3:1 ratio)
    alignSelf: 'center',
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#7f8c8d',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  input: {
    height: 56,
    borderColor: '#dfe6e9',
    borderWidth: 1,
    paddingHorizontal: 20,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2d3436',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  footerLink: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
// import axios from 'axios';
// import * as Notifications from 'expo-notifications';
// import { useRouter } from 'expo-router';
// import * as SecureStore from 'expo-secure-store';
// import { useEffect, useState } from 'react';
// import {
//   Alert,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from 'react-native';

// const API_BASE_URL = 'http://172.16.1.49:8080/api/auth';

// export default function LoginScreen() {
//   const [mobileNumber, setMobileNumber] = useState('');
//   const [otp, setOtp] = useState('');
//   const [showOtpField, setShowOtpField] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   // ✅ Check if user is already logged in
//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   // ✅ Check authentication status on app start
//   const checkAuthStatus = async () => {
//     try {
//       const token = await SecureStore.getItemAsync('authToken');
//       if (token) {
//         // User is already logged in, redirect to dashboard
//         router.replace('/DashboardScreen');
//       }
//     } catch (error) {
//       console.log('No existing auth token found');
//     }
//   };

//   // ✅ Request notification permissions
//   useEffect(() => {
//     const prepareNotifications = async () => {
//       const { status } = await Notifications.requestPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission denied', 'Enable notifications to receive OTP.');
//       }
//     };
//     prepareNotifications();
//   }, []);

//   // ✅ Show local notification
//   const sendOtpNotification = async (otpValue) => {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title: '📩 Your OTP',
//         body: `Your verification code is: ${otpValue}`,
//         sound: true,
//       },
//       trigger: null,
//     });
//   };

//   const handleSendOtp = async () => {
//     if (!/^\d{10}$/.test(mobileNumber)) {
//       Alert.alert('Invalid Input', 'Enter a valid 10-digit mobile number.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await axios.post(`${API_BASE_URL}/send-otp`, {
//         mobileNumber,
//       });

//       if (response.status === 200) {
//         const receivedOtp = response.data.otp;
//         setShowOtpField(true);
//         Alert.alert('Success', 'OTP sent to your mobile number.');

//         if (receivedOtp) {
//           setTimeout(() => {
//             setOtp(receivedOtp); // ✅ Autofill UI
//             sendOtpNotification(receivedOtp); // ✅ Optional: push notification
//             handleVerifyOtp(receivedOtp);     // ✅ Auto-verify
//           }, 500);
//         }
//       }
//     } catch (error) {
//       const message =
//         error.response?.data?.message || 'Failed to send OTP. Try again.';
//       Alert.alert('Error', message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyOtp = async (providedOtp) => {
//     const finalOtp = providedOtp || otp;

//     if (!/^\d{6}$/.test(finalOtp)) {
//       Alert.alert('Invalid Input', 'Enter a valid 6-digit OTP.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
//         mobileNumber,
//         otp: finalOtp,
//       });

//       const { token } = response.data;
      
//       // ✅ Store both token and mobile number
//       await SecureStore.setItemAsync('authToken', token);
//       await SecureStore.setItemAsync('userMobile', mobileNumber);
      
//       // ✅ Store login timestamp for dashboard
//       const loginTime = new Date().toISOString();
//       await SecureStore.setItemAsync('lastLoginTime', loginTime);

//       Alert.alert('Success', 'OTP verified. Logged in!');
//       router.replace('/DashboardScreen');
//     } catch (error) {
//       const message =
//         error.response?.data?.message || 'OTP verification failed.';
//       Alert.alert('Error', message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Login with Mobile Number</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Enter mobile number"
//         keyboardType="phone-pad"
//         value={mobileNumber}
//         onChangeText={setMobileNumber}
//         maxLength={10}
//       />

//       {showOtpField && (
//         <TextInput
//           style={styles.input}
//           placeholder="Enter OTP"
//           keyboardType="number-pad"
//           value={otp}
//           onChangeText={setOtp}
//           maxLength={6}
//         />
//       )}

//       <Pressable
//         style={[
//           styles.button,
//           loading || (!mobileNumber || (showOtpField && !otp))
//             ? styles.disabled
//             : {},
//         ]}
//         onPress={!showOtpField ? handleSendOtp : handleVerifyOtp}
//         disabled={loading || (!mobileNumber || (showOtpField && !otp))}
//       >
//         <Text style={styles.buttonText}>
//           {loading
//             ? 'Processing...'
//             : !showOtpField
//             ? 'Send OTP'
//             : 'Verify OTP'}
//         </Text>
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     marginBottom: 20,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   input: {
//     height: 50,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     marginBottom: 20,
//     paddingHorizontal: 15,
//     borderRadius: 8,
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   disabled: {
//     opacity: 0.5,
//   },
// });