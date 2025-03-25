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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

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
  
  useEffect(() => {
    // Start animations
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
  }, []);
  
  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
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
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>Create your account credentials</Text>
      
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
          <Text style={isRecruiter ? styles.userTypeInactive : styles.userTypeActive}>
            Job Seeker
          </Text>
          <Switch
            value={isRecruiter}
            onValueChange={toggleUserType}
            trackColor={{ false: COLORS.primary, true: COLORS.accent }}
            thumbColor="white"
            ios_backgroundColor={COLORS.primary}
          />
          <Text style={isRecruiter ? styles.userTypeActive : styles.userTypeInactive}>
            Recruiter
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.nextButton} 
        onPress={nextStep}
      >
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
      <Text style={styles.stepDescription}>Tell us more about {isRecruiter ? 'your company' : 'yourself'}</Text>
      
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
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={loading}
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
    </Animated.View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
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
              styles.formContainer,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <View style={styles.stepsIndicator}>
              <View style={[styles.stepDot, currentStep >= 1 && styles.activeStep]}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, currentStep >= 2 && styles.activeStep]}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
            </View>
            
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
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
    height: height * 0.25,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.l,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.l,
    ...SHADOWS.large,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.s,
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
    minHeight: 400, // Adjust based on your content
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: FONTS.h3,
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
  },
  inputIcon: {
    padding: SPACING.m,
  },
  input: {
    flex: 1,
    height: 48,
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
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userTypeActive: {
    fontSize: FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: SPACING.m,
  },
  userTypeInactive: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.m,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.small,
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
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    flex: 1,
    marginRight: SPACING.m,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  registerButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 2,
    ...SHADOWS.small,
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