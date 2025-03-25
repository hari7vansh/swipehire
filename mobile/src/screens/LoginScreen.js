import React, { useState, useEffect, useRef } from 'react';
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
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar // Added StatusBar import
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, API_URL } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // Animation references
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Clear any previous errors when component mounts
    setError('');
    
    // Start animations - all using useNativeDriver: true for consistency
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
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
    try {
      console.log('Attempting login with:', username);
      console.log('API URL:', API_URL);
      
      const response = await authAPI.login(username, password);
      console.log('Login response:', response.data);
      
      // Just store auth data and App.js will handle navigation automatically
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userType', response.data.user_type);
      await AsyncStorage.setItem('userId', response.data.user_id.toString());
      
      // The App.js useEffect will detect the token and handle navigation
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      // More specific error message based on error type
      if (!error.response && !error.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
        
        // For testing convenience in development
        if (__DEV__ && (username === 'recruiter' || username === 'jobseeker')) {
          const mockUserType = username === 'recruiter' ? 'recruiter' : 'job_seeker';
          const mockUserId = username === 'recruiter' ? '1' : '2';
          const mockToken = username === 'recruiter' 
            ? 'ca9db1703a90cb560cddd1fe518d236b3c6010aa'
            : 'ff70777824a6bbb0b33d4f79c0b3a7b484525090';
            
          await AsyncStorage.setItem('token', mockToken);
          await AsyncStorage.setItem('userType', mockUserType);
          await AsyncStorage.setItem('userId', mockUserId);
        }
      } else if (error.response?.data) {
        setError(error.response.data.error || 'Login failed. Please check your credentials.');
      } else {
        setError('Connection error. The server may be unavailable.');
      }
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
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={styles.headerBackground}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeIn,
                transform: [
                  { translateY: slideUp },
                  { scale: logoScale }
                ]
              }
            ]}
          >
            <Text style={styles.logoText}>SwipeHire</Text>
            <Text style={styles.tagline}>Find your perfect match</Text>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }]
              }
            ]}
          >
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="white" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={COLORS.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              >
                <Ionicons
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
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
                <>
                  <Ionicons name="log-in-outline" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.loginButtonText}>Log In</Text>
                </>
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
                    await AsyncStorage.setItem('token', 'debug-token');
                    await AsyncStorage.setItem('userType', 'job_seeker');
                    await AsyncStorage.setItem('userId', '2');
                    Alert.alert('Debug Mode', 'Logged in as job seeker');
                  } catch (error) {
                    Alert.alert('Debug Error', error.message);
                  }
                }}
              >
                <Text style={styles.debugButtonText}>Developer Login</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.l,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
    marginBottom: height * 0.05,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.s,
  },
  tagline: {
    fontSize: FONTS.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.xl,
    ...SHADOWS.large,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    marginBottom: SPACING.m,
  },
  errorText: {
    color: 'white',
    marginLeft: SPACING.s,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radiusMedium,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.background,
  },
  inputIcon: {
    padding: SPACING.m,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: SPACING.m,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.l,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONTS.label,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.medium,
  },
  buttonIcon: {
    marginRight: SPACING.s,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.l,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.body,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
  // Debug styles - remove in production
  debugButton: {
    marginTop: SPACING.xl,
    backgroundColor: '#eee',
    padding: SPACING.s,
    borderRadius: BORDERS.radiusMedium,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#666',
    fontSize: FONTS.caption,
  },
});

export default LoginScreen;