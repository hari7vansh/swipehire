import React, { useState, useEffect, useRef } from 'react';
import {
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'job_seeker',
    company_name: '',
    position: '',
    skills: '',
    experience_years: '0',
  });
  
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Refs for TextInput focus
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const companyNameRef = useRef(null);
  const positionRef = useRef(null);
  
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      
      // Haptic feedback for moving to next step
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Hide keyboard
      Keyboard.dismiss();

      // Animate step transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => {
        setCurrentStep(2);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
      });
    }
  };
  
  const prevStep = () => {
    // Haptic feedback for going back
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Hide keyboard
    Keyboard.dismiss();
    
    // Animate step transition
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setCurrentStep(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    });
  };
  
  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };
  
  const toggleUserType = () => {
    // Haptic feedback for toggle
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setIsRecruiter(!isRecruiter);
    handleChange('user_type', !isRecruiter ? 'recruiter' : 'job_seeker');
  };
  
  const validateStep1 = () => {
    setError('');
    
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = () => {
    setError('');
    
    if (isRecruiter && (!formData.company_name || !formData.position)) {
      setError('Please fill in company name and position');
      return false;
    }
    
    return true;
  };
  
  const handleRegister = async () => {
    if (!validateStep2()) return;
    
    // Haptic feedback for submitting form
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setLoading(true);
    try {
      // In a real app, this would connect to your API
      // For now, we're using mock data since backend connection isn't available
      
      // Create mock response data
      const mockResponse = {
        data: {
          token: 'mock-token-' + Math.random().toString(36).substr(2, 10),
          user_id: Math.floor(Math.random() * 1000) + 10,
          user_type: formData.user_type,
          username: formData.username
        }
      };
      
      // Store authentication data
      await AsyncStorage.setItem('token', mockResponse.data.token);
      await AsyncStorage.setItem('userType', mockResponse.data.user_type);
      await AsyncStorage.setItem('userId', mockResponse.data.user_id.toString());
      
      // Success feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Show success message
      Alert.alert(
        "Account Created!",
        "Your account has been successfully created.",
        [
          { 
            text: "OK", 
            onPress: () => {
              // The app will detect the token and navigate to the main screen
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      
      // Error feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Account</Text>
      <Text style={styles.stepDescription}>Enter your basic information to get started</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Username *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor="#999"
            value={formData.username}
            onChangeText={value => handleChange('username', value)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            ref={emailRef}
            style={styles.input}
            placeholder="Your email address"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={value => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="Choose a password (min 6 characters)"
            placeholderTextColor="#999"
            value={formData.password}
            onChangeText={value => handleChange('password', value)}
            secureTextEntry={secureTextEntry}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Ionicons
              name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.userTypeContainer}>
        <Text style={styles.userTypeLabel}>I am registering as:</Text>
        <View style={styles.switchContainer}>
          <View style={[styles.userTypeOption, !isRecruiter && styles.activeOption]}>
            <MaterialCommunityIcons 
              name="briefcase-search" 
              size={20} 
              color={!isRecruiter ? COLORS.primary : "#666"} 
            />
            <Text style={isRecruiter ? styles.userTypeInactive : styles.userTypeActive}>
              Job Seeker
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.toggleContainer}
            onPress={toggleUserType}
            activeOpacity={0.7}
          >
            <View style={[styles.toggle, isRecruiter && styles.toggleActive]}>
              <Animated.View style={[
                styles.toggleCircle,
                { transform: [{ translateX: isRecruiter ? 20 : 0 }] }
              ]} />
            </View>
          </TouchableOpacity>
          
          <View style={[styles.userTypeOption, isRecruiter && styles.activeOption]}>
            <MaterialCommunityIcons 
              name="account-tie" 
              size={20} 
              color={isRecruiter ? COLORS.primary : "#666"} 
            />
            <Text style={isRecruiter ? styles.userTypeActive : styles.userTypeInactive}>
              Recruiter
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.nextButton} 
        onPress={nextStep}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
  
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Profile Details</Text>
      <Text style={styles.stepDescription}>
        {isRecruiter 
          ? 'Tell us about your company and role' 
          : 'Share some information about yourself'}
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>First Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            ref={firstNameRef}
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor="#999"
            value={formData.first_name}
            onChangeText={value => handleChange('first_name', value)}
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Last Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            ref={lastNameRef}
            style={styles.input}
            placeholder="Your last name"
            placeholderTextColor="#999"
            value={formData.last_name}
            onChangeText={value => handleChange('last_name', value)}
            returnKeyType={isRecruiter ? "next" : "done"}
            onSubmitEditing={() => {
              if (isRecruiter) companyNameRef.current?.focus();
            }}
          />
        </View>
      </View>
      
      {isRecruiter ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                ref={companyNameRef}
                style={styles.input}
                placeholder="Your company's name"
                placeholderTextColor="#999"
                value={formData.company_name}
                onChangeText={value => handleChange('company_name', value)}
                returnKeyType="next"
                onSubmitEditing={() => positionRef.current?.focus()}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Position *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                ref={positionRef}
                style={styles.input}
                placeholder="Your role at the company"
                placeholderTextColor="#999"
                value={formData.position}
                onChangeText={value => handleChange('position', value)}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Skills</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="code-working-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Skills (comma separated)"
                placeholderTextColor="#999"
                value={formData.skills}
                onChangeText={value => handleChange('skills', value)}
                returnKeyType="done"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Years of work experience"
                placeholderTextColor="#999"
                value={formData.experience_years}
                onChangeText={value => handleChange('experience_years', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </>
      )}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={prevStep}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.registerButtonText}>Create Account</Text>
              <Ionicons name="checkmark-circle" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButtonTop}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign Up</Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: currentStep === 1 ? '50%' : '100%' }]} />
            </View>
            <View style={styles.stepsIndicator}>
              <View style={[styles.stepDot, styles.activeStep]}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, currentStep === 2 && styles.activeStep]}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
            </View>
          </View>
          
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="white" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {currentStep === 1 ? renderStep1() : renderStep2()}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
  },
  backButtonTop: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  stepsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 12,
  },
  userTypeContainer: {
    marginBottom: 24,
  },
  userTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeOption: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  userTypeActive: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  userTypeInactive: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
  },
  toggleContainer: {
    marginHorizontal: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    padding: 4,
  },
  toggleActive: {
    backgroundColor: 'rgba(25, 118, 210, 0.4)',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    width: '30%',
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 15,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;