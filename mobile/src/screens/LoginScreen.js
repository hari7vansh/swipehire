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
  Keyboard,
  Vibration
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, API_URL } from '../services/api';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
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
  const slideUp = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  
  // Animation for background shapes
  const shape1Position = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;
  const shape2Position = useRef(new Animated.ValueXY({ x: width, y: 100 })).current;
  const shape3Position = useRef(new Animated.ValueXY({ x: width/2, y: height/3 })).current;
  
  // Refs for TextInput focus
  const passwordRef = useRef(null);
  
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
            toValue: -40,
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
      }),
      // Animate background shapes
      Animated.spring(shape1Position, {
        toValue: { x: -30, y: -30 },
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(shape2Position, {
        toValue: { x: width - 100, y: 120 },
        friction: 7,
        tension: 30,
        useNativeDriver: true,
      }),
      Animated.spring(shape3Position, {
        toValue: { x: width/4, y: height/3 - 50 },
        friction: 7,
        tension: 20,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start floating animation for shapes
    startFloatingAnimation();
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Floating animation for background shapes
  const startFloatingAnimation = () => {
    const createFloatAnimation = (shapePosition, offsetX, offsetY, duration) => {
      return Animated.sequence([
        Animated.timing(shapePosition, {
          toValue: { 
            x: shapePosition.x._value + offsetX, 
            y: shapePosition.y._value + offsetY 
          },
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(shapePosition, {
          toValue: { 
            x: shapePosition.x._value, 
            y: shapePosition.y._value 
          },
          duration: duration,
          useNativeDriver: true,
        })
      ]);
    };
    
    // Create infinite floating animation
    const floatingLoop = () => {
      Animated.parallel([
        createFloatAnimation(shape1Position, 10, 15, 3000),
        createFloatAnimation(shape2Position, -15, 10, 4000),
        createFloatAnimation(shape3Position, 5, -10, 3500)
      ]).start(() => floatingLoop());
    };
    
    floatingLoop();
  };

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(30);
    }
    
    setError('');
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      console.log('Attempting login with:', username);
      console.log('API URL:', API_URL);
      
      const response = await authAPI.login(username, password);
      
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
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
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
                outputRange: [0, 0.7]
              }),
              transform: [
                { translateX: shape1Position.x },
                { translateY: shape1Position.y }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.shape2, 
            { 
              opacity: fadeIn.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6]
              }),
              transform: [
                { translateX: shape2Position.x },
                { translateY: shape2Position.y }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.shape3, 
            { 
              opacity: fadeIn.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.4]
              }),
              transform: [
                { translateX: shape3Position.x },
                { translateY: shape3Position.y }
              ]
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
            <LinearGradient
              colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.2)']}
              style={styles.logoBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="briefcase" size={50} color={COLORS.primary} />
            </LinearGradient>
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
            
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={COLORS.placeholder}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Enter your password"
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
            </View>
            
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.loginButtonContent}>
                    <Ionicons name="log-in-outline" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </View>
                )}
              </LinearGradient>
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
                      setUsername('recruiter');
                      setPassword('password123');
                      handleLogin();
                    }}
                  >
                    <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.debugButtonText}>As Recruiter</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.debugButton} 
                    onPress={async () => {
                      setUsername('jobseeker');
                      setPassword('password123');
                      handleLogin();
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
    bottom: 0,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'white',
    transform: [{ scale: 1.2 }],
  },
  shape2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'white',
    transform: [{ scale: 1.2 }],
  },
  shape3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    transform: [{ scale: 1.2 }],
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
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.large,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONTS.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusLarge,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.l,
    ...SHADOWS.large,
  },
  formTitle: {
    fontSize: FONTS.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
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
  inputGroup: {
    marginBottom: SPACING.m,
  },
  inputLabel: {
    fontSize: FONTS.label,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radiusMedium,
    backgroundColor: COLORS.background,
    ...SHADOWS.small,
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
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: BORDERS.radiusMedium,
    height: 56,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
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