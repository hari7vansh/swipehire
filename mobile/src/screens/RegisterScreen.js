import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
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
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  
  // Animation for steps
  const slideInRight = useRef(new Animated.Value(width)).current;
  const slideOutLeft = useRef(new Animated.Value(0)).current;
  
  // Progress indicator animation
  const progressWidth = useRef(new Animated.Value(0)).current;
  const progressValue = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });
  
  useEffect(() => {
    // Update progress based on step
    Animated.timing(progressWidth, {
      toValue: currentStep === 1 ? 0.5 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
    
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
      })
    ]).start();
  }, [currentStep]);
  
  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      
      // Haptic feedback for moving to next step
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    
    // Animate step transition
    Animated.parallel([
      Animated.timing(slideOutLeft, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideInRight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentStep(2);
      slideOutLeft.setValue(0);
      slideInRight.setValue(width);
    });
  };
  
  const prevStep = () => {
    // Haptic feedback for going back
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Animate step transition (reverse)
    Animated.parallel([
      Animated.timing(slideOutLeft, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideInRight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentStep(1);
      slideOutLeft.setValue(0);
      slideInRight.setValue(width);
    });
  };
  
  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
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
              // We'll navigate back to Login which will trigger the App.js useEffect
              // to check for the token and redirect to Main
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
    <Animated.View
      style={[
        styles.stepContainer,
        {
          transform: [{ translateX: slideOutLeft }],
        },
      ]}
    >
      <Text style={styles.stepTitle}>Create Account</Text>
      <Text style={styles.stepDescription}>Enter your basic information to get started</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Username *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor={COLORS.placeholder}
            value={formData.username}
            onChangeText={value => handleChange('username', value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Your email address"
            placeholderTextColor={COLORS.placeholder}
            value={formData.email}
            onChangeText={value => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Choose a password (min 6 characters)"
            placeholderTextColor={COLORS.placeholder}
            value={formData.password}
            onChangeText={value => handleChange('password', value)}
            secureTextEntry={secureTextEntry}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Ionicons
              name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={COLORS.textSecondary}
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
              color={!isRecruiter ? COLORS.primary : COLORS.textSecondary} 
            />
            <Text style={isRecruiter ? styles.userTypeInactive : styles.userTypeActive}>
              Job Seeker
            </Text>
          </View>
          
          <Switch
            value={isRecruiter}
            onValueChange={toggleUserType}
            trackColor={{ false: COLORS.primary, true: COLORS.accent }}
            thumbColor="white"
            ios_backgroundColor={COLORS.primary}
            style={styles.switch}
          />
          
          <View style={[styles.userTypeOption, isRecruiter && styles.activeOption]}>
            <MaterialCommunityIcons 
              name="account-tie" 
              size={20} 
              color={isRecruiter ? COLORS.accent : COLORS.textSecondary} 
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
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
  
  const renderStep2 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: [{ translateX: currentStep === 1 ? slideInRight : 0 }],
        },
      ]}
    >
      <Text style={styles.stepTitle}>Profile Details</Text>
      <Text style={styles.stepDescription}>
        {isRecruiter 
          ? 'Tell us about your company and role' 
          : 'Share some information about yourself'}
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>First Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor={COLORS.placeholder}
            value={formData.first_name}
            onChangeText={value => handleChange('first_name', value)}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Last Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Your last name"
            placeholderTextColor={COLORS.placeholder}
            value={formData.last_name}
            onChangeText={value => handleChange('last_name', value)}
          />
        </View>
      </View>
      
      {isRecruiter ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your company's name"
                placeholderTextColor={COLORS.placeholder}
                value={formData.company_name}
                onChangeText={value => handleChange('company_name', value)}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Position *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your role at the company"
                placeholderTextColor={COLORS.placeholder}
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
              <Ionicons name="code-working-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Skills (comma separated)"
                placeholderTextColor={COLORS.placeholder}
                value={formData.skills}
                onChangeText={value => handleChange('skills', value)}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Years of work experience"
                placeholderTextColor={COLORS.placeholder}
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
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentDark]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
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
    </Animated.View>
  );
  
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
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign Up</Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    width: progressValue
                  }
                ]} 
              />
            </View>
            <View style={styles.stepsIndicator}>
              <View style={[styles.stepDot, styles.activeStep]}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, currentStep >= 2 && styles.activeStep]}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
            </View>
          </View>
          
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="white" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.stepsContainer}>
              {renderStep1()}
              {currentStep === 2 && renderStep2()}
            </View>
            
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
    backgroundColor: COLORS.background,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'ios' ? SPACING.l : StatusBar.currentHeight + SPACING.m,
    paddingBottom: SPACING.m,
  },
  backButtonTop: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  headerTitle: {
    fontSize: FONTS.h2,
    fontWeight: 'bold',
    color: 'white',
  },
  progressContainer: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.l,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.m,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
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
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: 'white',
  },
  stepNumber: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: SPACING.s,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
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
  stepsContainer: {
    position: 'relative',
    minHeight: 400, // Adjust based on content
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: FONTS.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
  },
  inputGroup: {
    marginBottom: SPACING.m,
  },
  inputLabel: {
    fontSize: FONTS.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
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
    height: 54,
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: SPACING.m,
  },
  userTypeContainer: {
    marginBottom: SPACING.l,
  },
  userTypeLabel: {
    fontSize: FONTS.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
    marginLeft: SPACING.xs,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.s,
    borderRadius: BORDERS.radiusMedium,
    flex: 1,
    justifyContent: 'center',
  },
  activeOption: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  userTypeActive: {
    fontSize: FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  userTypeInactive: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  switch: {
    transform: [{ scale: 1.1 }],
    marginHorizontal: SPACING.m,
  },
  nextButton: {
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    height: 56,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  nextButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
    marginRight: SPACING.s,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.m,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.m,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    width: '30%',
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  registerButton: {
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    width: '65%',
    height: 56,
    ...SHADOWS.medium,
  },
  registerButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.body,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;