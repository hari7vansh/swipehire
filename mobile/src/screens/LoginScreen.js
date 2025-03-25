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
  StatusBar,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, API_URL } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Set up keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Shrink logo when keyboard shows
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 0.6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Restore logo when keyboard hides
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );
    
    // Clear any previous errors when component mounts
    setError('');
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
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
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setError('');
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      console.log('Attempting login with:', username);
      console.log('API URL:', API_URL);
      
      const response = await authAPI.login(username, password);
      console.log('Login response:', response.data);
      
      // Store auth data
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userType', response.data.user_type);
      await AsyncStorage.setItem('userId', response.data.user_id.toString());
      
      // Success haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      
      // Error haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
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
    // For now just show an alert
    Alert.alert(
      'Reset Password',
      'A password reset feature will be available in a future update.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={styles.headerBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Background shapes for visual interest */}
      <View style={styles.backgroundShapes}>
        <Animated.View 
          style={[
            styles.shape1, 
            { 
              opacity: fadeIn.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6]
              })
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.shape2, 
            { 
              opacity: fadeIn.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5]
              })
            }
          ]} 
        />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & App Name */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeIn,
                transform: [
                  { translateY: slideUp },
                  { scale: logoScale },
                  { translateY: logoTranslateY }
                ]
              }
            ]}
          >
            <View style={styles.logoBadge}>
              <Ionicons name="briefcase" size={50} color="white" />
            </View>
            <Text style={styles.logoText}>SwipeHire</Text>
            <Text style={styles.tagline}>Find your perfect match</Text>
          </Animated.View>
          
          {/* Login Form */}
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
                returnKeyType="next"
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
                returnKeyType="go"
                onSubmitEditing={handleLogin}
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
              activeOpacity={0.8}
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
              <TouchableOpacity 
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            
            {/* Debug section for development */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugHeader}>Quick Login (Development Only)</Text>
                <View style={styles.debugButtonRow}>
                  <TouchableOpacity 
                    style={styles.debugButton} 
                    onPress={async () => {
                      try {
                        setUsername('recruiter');
                        setPassword('password123');
                        await AsyncStorage.setItem('token', 'debug-token-recruiter');
                        await AsyncStorage.setItem('userType', 'recruiter');
                        await AsyncStorage.setItem('userId', '1');
                      } catch (error) {
                        Alert.alert('Debug Error', error.message);
                      }
                    }}
                  >
                    <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.debugButtonText}>As Recruiter</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.debugButton} 
                    onPress={async () => {
                      try {
                        setUsername('jobseeker');
                        setPassword('password123');
                        await AsyncStorage.setItem('token', 'debug-token-jobseeker');
                        await AsyncStorage.setItem('userType', 'job_seeker');
                        await AsyncStorage.setItem('userId', '2');
                      } catch (error) {
                        Alert.alert('Debug Error', error.message);
                      }
                    }}
                  >
                    <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.debugButtonText}>As Job Seeker</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'white',
    top: -50,
    right: -50,
    opacity: 0.1,
  },
  shape2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'white',
    bottom: 20,
    left: -30,
    opacity: 0.1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.12,
    marginBottom: height * 0.05,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONTS.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusLarge,
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
    height: 56,
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
    height: 56,
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
  // Debug styles - only used in development
  debugContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.m,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BORDERS.radiusMedium,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  debugHeader: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  debugButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BORDERS.radiusMedium,
  },
  debugButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.caption,
    marginLeft: 4,
  },
});

export default LoginScreen;