import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Animated,
  Keyboard,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { jobsAPI } from '../services/api';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

const CreateJobScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'full_time',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    is_remote: false,
    skills_required: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState('basic'); // 'basic', 'details', 'requirements'
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(Platform.OS === 'ios' ? 120 : 140)).current;
  const contentOpacity = useRef([
    new Animated.Value(1), // basic
    new Animated.Value(0), // details
    new Animated.Value(0)  // requirements
  ]).current;
  
  // Refs for TextInput focus
  const descriptionInputRef = useRef(null);
  const requirementsInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const salaryMinInputRef = useRef(null);
  const salaryMaxInputRef = useRef(null);
  const skillsInputRef = useRef(null);
  
  useEffect(() => {
    // Start entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
    
    // Setup keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(headerHeight, {
          toValue: Platform.OS === 'ios' ? 80 : 100,
          duration: 300,
          useNativeDriver: false
        }).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(headerHeight, {
          toValue: Platform.OS === 'ios' ? 120 : 140,
          duration: 300,
          useNativeDriver: false
        }).start();
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Animate section transitions
  useEffect(() => {
    const sectionIndex = 
      currentSection === 'basic' ? 0 :
      currentSection === 'details' ? 1 : 2;
    
    // Fade out current section, then fade in new section
    contentOpacity.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === sectionIndex ? 1 : 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    });
  }, [currentSection]);
  
  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear validation error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateSection = (section) => {
    let newErrors = {};
    let isValid = true;
    
    if (section === 'basic') {
      if (!formData.title.trim()) {
        newErrors.title = 'Job title is required';
        isValid = false;
      }
      
      if (!formData.location.trim() && !formData.is_remote) {
        newErrors.location = 'Location is required for non-remote jobs';
        isValid = false;
      }
    }
    
    if (section === 'details') {
      if (formData.salary_min && formData.salary_max) {
        const minSalary = parseInt(formData.salary_min);
        const maxSalary = parseInt(formData.salary_max);
        
        if (minSalary > maxSalary) {
          newErrors.salary_min = 'Minimum salary cannot be greater than maximum';
          newErrors.salary_max = 'Maximum salary cannot be less than minimum';
          isValid = false;
        }
      }
    }
    
    if (section === 'requirements') {
      if (!formData.description.trim()) {
        newErrors.description = 'Job description is required';
        isValid = false;
      }
      
      if (!formData.requirements.trim()) {
        newErrors.requirements = 'Job requirements are required';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const validateForm = () => {
    // Validate all sections before submission
    const basicValid = validateSection('basic');
    const detailsValid = validateSection('details');
    const requirementsValid = validateSection('requirements');
    
    return basicValid && detailsValid && requirementsValid;
  };
  
  const nextSection = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Validate current section before proceeding
    if (!validateSection(currentSection)) return;
    
    if (currentSection === 'basic') {
      setCurrentSection('details');
    } else if (currentSection === 'details') {
      setCurrentSection('requirements');
    }
  };
  
  const prevSection = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (currentSection === 'details') {
      setCurrentSection('basic');
    } else if (currentSection === 'requirements') {
      setCurrentSection('details');
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Set current section to first section with errors
      if (errors.title || errors.location) {
        setCurrentSection('basic');
      } else if (errors.salary_min || errors.salary_max) {
        setCurrentSection('details');
      } else {
        setCurrentSection('requirements');
      }
      return;
    }
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setLoading(true);
    try {
      await jobsAPI.createJob(formData);
      
      // Success feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Success',
        'Job posted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      // Error feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert('Error', 'Failed to post job. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderBasicSection = () => (
    <Animated.View style={{ opacity: contentOpacity[0] }}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Title *</Text>
          <View style={[
            styles.inputContainer, 
            errors.title && styles.inputError
          ]}>
            <MaterialIcons name="work-outline" size={22} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              placeholder="e.g. Senior Software Engineer"
              placeholderTextColor={COLORS.placeholder}
              returnKeyType="next"
              onSubmitEditing={() => locationInputRef.current.focus()}
            />
          </View>
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={[
            styles.inputContainer,
            errors.location && styles.inputError
          ]}>
            <Ionicons name="location-outline" size={22} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              ref={locationInputRef}
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleChange('location', value)}
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>
        
        <View style={styles.switchContainer}>
          <View style={styles.switchTextContainer}>
            <Ionicons name="home-outline" size={22} color={COLORS.textSecondary} style={styles.switchIcon} />
            <Text style={styles.switchLabel}>Remote Position</Text>
          </View>
          <Switch
            value={formData.is_remote}
            onValueChange={(value) => handleChange('is_remote', value)}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={formData.is_remote ? COLORS.primary : '#f4f3f4'}
            ios_backgroundColor={COLORS.border}
          />
        </View>
        
        <Text style={styles.label}>Job Type</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'full_time' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'full_time')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'full_time' && styles.selectedPillText
            ]}>Full Time</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'part_time' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'part_time')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'part_time' && styles.selectedPillText
            ]}>Part Time</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'contract' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'contract')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'contract' && styles.selectedPillText
            ]}>Contract</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'internship' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'internship')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'internship' && styles.selectedPillText
            ]}>Internship</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={nextSection}
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
      </View>
    </Animated.View>
  );
  
  const renderDetailsSection = () => (
    <Animated.View 
      style={{ 
        opacity: contentOpacity[1],
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        display: currentSection === 'details' ? 'flex' : 'none'
      }}
    >
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Job Details</Text>
        
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'entry' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'entry')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'entry' && styles.selectedPillText
            ]}>Entry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'mid' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'mid')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'mid' && styles.selectedPillText
            ]}>Mid</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'senior' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'senior')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'senior' && styles.selectedPillText
            ]}>Senior</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'executive' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'executive')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'executive' && styles.selectedPillText
            ]}>Executive</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.rowContainer}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Min. Salary</Text>
            <View style={[
              styles.inputContainer,
              errors.salary_min && styles.inputError
            ]}>
              <FontAwesome5 name="dollar-sign" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={salaryMinInputRef}
                style={styles.input}
                value={formData.salary_min}
                onChangeText={(value) => handleChange('salary_min', value)}
                keyboardType="numeric"
                placeholder="e.g. 50000"
                placeholderTextColor={COLORS.placeholder}
                returnKeyType="next"
                onSubmitEditing={() => salaryMaxInputRef.current.focus()}
              />
            </View>
            {errors.salary_min && <Text style={styles.errorText}>{errors.salary_min}</Text>}
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>Max. Salary</Text>
            <View style={[
              styles.inputContainer,
              errors.salary_max && styles.inputError
            ]}>
              <FontAwesome5 name="dollar-sign" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={salaryMaxInputRef}
                style={styles.input}
                value={formData.salary_max}
                onChangeText={(value) => handleChange('salary_max', value)}
                keyboardType="numeric"
                placeholder="e.g. 80000"
                placeholderTextColor={COLORS.placeholder}
                returnKeyType="next"
                onSubmitEditing={() => skillsInputRef.current.focus()}
              />
            </View>
            {errors.salary_max && <Text style={styles.errorText}>{errors.salary_max}</Text>}
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Required Skills (comma separated)</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="tag-multiple-outline" size={22} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              ref={skillsInputRef}
              style={styles.input}
              value={formData.skills_required}
              onChangeText={(value) => handleChange('skills_required', value)}
              placeholder="e.g. React, Python, SQL"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevSection}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={nextSection}
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
      </View>
    </Animated.View>
  );
  
  const renderRequirementsSection = () => (
    <Animated.View 
      style={{ 
        opacity: contentOpacity[2],
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        display: currentSection === 'requirements' ? 'flex' : 'none'
      }}
    >
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Description & Requirements</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Description *</Text>
          <View style={[
            styles.textAreaContainer,
            errors.description && styles.inputError
          ]}>
            <TextInput
              ref={descriptionInputRef}
              style={styles.textArea}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Provide a detailed description of the role..."
              placeholderTextColor={COLORS.placeholder}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => requirementsInputRef.current.focus()}
            />
          </View>
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requirements *</Text>
          <View style={[
            styles.textAreaContainer,
            errors.requirements && styles.inputError
          ]}>
            <TextInput
              ref={requirementsInputRef}
              style={styles.textArea}
              value={formData.requirements}
              onChangeText={(value) => handleChange('requirements', value)}
              placeholder="List the requirements for this position..."
              placeholderTextColor={COLORS.placeholder}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          {errors.requirements && <Text style={styles.errorText}>{errors.requirements}</Text>}
        </View>
      </View>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevSection}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
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
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Post Job</Text>
              <Ionicons name="checkmark-circle" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
  
  const renderProgressBar = () => {
    let progress = 0;
    if (currentSection === 'basic') progress = 33;
    else if (currentSection === 'details') progress = 66;
    else progress = 100;
    
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressSteps}>
          <View style={[
            styles.progressStep, 
            (currentSection === 'basic' || currentSection === 'details' || currentSection === 'requirements') && styles.activeProgressStep
          ]}>
            <Text style={styles.progressStepText}>1</Text>
          </View>
          <View style={[
            styles.progressStep, 
            (currentSection === 'details' || currentSection === 'requirements') && styles.activeProgressStep
          ]}>
            <Text style={styles.progressStepText}>2</Text>
          </View>
          <View style={[
            styles.progressStep, 
            currentSection === 'requirements' && styles.activeProgressStep
          ]}>
            <Text style={styles.progressStepText}>3</Text>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButtonHeader}
            onPress={() => {
              Alert.alert(
                'Discard Job Post',
                'Are you sure you want to go back? Your job post will not be saved.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
                ]
              );
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Post a New Job</Text>
        </View>
        
        {renderProgressBar()}
      </Animated.View>
      
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentSection === 'basic' && renderBasicSection()}
        {renderDetailsSection()}
        {renderRequirementsSection()}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    justifyContent: 'flex-end',
    paddingBottom: SPACING.m,
    zIndex: 10,
    ...SHADOWS.medium
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'ios' ? SPACING.s : StatusBar.currentHeight,
  },
  backButtonHeader: {
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
  progressBarContainer: {
    paddingHorizontal: SPACING.l,
    marginTop: SPACING.m,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.s,
  },
  progressStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeProgressStep: {
    backgroundColor: 'white',
  },
  progressStepText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: SPACING.l,
    paddingBottom: SPACING.xxl,
    position: 'relative',
  },
  formSection: {
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    fontSize: FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  inputGroup: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: FONTS.label,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.small,
    marginLeft: SPACING.s,
    marginTop: 2,
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
  textAreaContainer: {
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.s,
    ...SHADOWS.small,
  },
  textArea: {
    height: 160,
    fontSize: FONTS.body,
    color: COLORS.text,
    textAlignVertical: 'top',
    padding: SPACING.s,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  switchTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchIcon: {
    marginRight: SPACING.s,
  },
  switchLabel: {
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  halfInput: {
    width: '48%',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
    marginBottom: SPACING.m,
  },
  typePill: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SPACING.s,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.label,
    fontWeight: '500',
  },
  selectedPillText: {
    color: 'white',
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.l,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
    flex: 1,
    marginRight: SPACING.m,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    ...SHADOWS.medium,
    flex: 1,
    overflow: 'hidden',
  },
  nextButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.accent,
    borderRadius: BORDERS.radiusMedium,
    ...SHADOWS.medium,
    flex: 1,
    overflow: 'hidden',
  },
  submitButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
});

export default CreateJobScreen;