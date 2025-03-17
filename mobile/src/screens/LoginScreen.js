import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, API_URL } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Clear any previous errors when component mounts
    setError('');
  }, []);

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError('');
    if (!validateForm()) return;
  
    setLoading(true);
    // In handleLogin function
    try {
      console.log('Attempting login with:', username);
      console.log('API URL:', API_URL);
      
      const response = await authAPI.login(username, password);
      console.log('Login response:', response.data);
      
      // Store auth data
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userType', response.data.user_type);
      await AsyncStorage.setItem('userId', response.data.user_id.toString());
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }]
      });
    } catch (error) {
      console.error('Login error:', error);
      // More specific error message based on error type
      if (error.message && error.message.includes('timeout')) {
        setError('Connection timeout. Using offline mode.');
        // Auto-login for testing (remove in production)
        if (username === 'recruiter' || username === 'jobseeker') {
          const mockUserType = username === 'recruiter' ? 'recruiter' : 'job_seeker';
          const mockUserId = username === 'recruiter' ? '1' : '2';
          const mockToken = username === 'recruiter' 
            ? 'ca9db1703a90cb560cddd1fe518d236b3c6010aa'
            : 'ff70777824a6bbb0b33d4f79c0b3a7b484525090';
            
          await AsyncStorage.setItem('token', mockToken);
          await AsyncStorage.setItem('userType', mockUserType);
          await AsyncStorage.setItem('userId', mockUserId);
          
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }]
          });
        }
      } else if (error.response?.data) {
        setError(error.response.data.error || 'Login failed. Please check your credentials.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // For now just show an alert, this could be expanded later
    Alert.alert(
      'Reset Password',
      'A password reset feature will be available in a future update.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SwipeHire</Text>
            <Text style={styles.tagline}>Find your perfect match</Text>
          </View>
          
          <View style={styles.formContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            
            {/* Debug button for testing - remove in production */}
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.debugButton} 
                onPress={async () => {
                  try {
                    const response = await fetch(`${API_URL}/users/login/`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        username: 'recruiter',
                        password: 'password123',
                      }),
                    });
                    const text = await response.text();
                    Alert.alert('API Test Result', text.substring(0, 200));
                  } catch (error) {
                    Alert.alert('API Test Error', error.message);
                  }
                }}
              >
                <Text style={styles.debugButtonText}>Test API Connection</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Debug styles - remove in production
  debugButton: {
    marginTop: 20,
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#333',
    fontSize: 12,
  },
});

export default LoginScreen;