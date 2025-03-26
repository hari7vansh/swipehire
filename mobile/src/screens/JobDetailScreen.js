import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Share,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import * as Haptics from 'expo-haptics';
import { jobsAPI } from '../services/api';

const JobDetailScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await jobsAPI.getJob(jobId);
        setJob(response.data);
        setLoading(false);
        
        // Animate content in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(slideUp, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
          })
        ]).start();
        
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Unable to load job details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [jobId]);

  const handleSaveJob = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsSaved(!isSaved);
    
    // In a real app, you would call an API to save/unsave the job
    Alert.alert(
      isSaved ? 'Job Unsaved' : 'Job Saved',
      isSaved ? 'This job has been removed from your saved list.' : 'This job has been added to your saved list.',
      [{ text: 'OK' }]
    );
  };

  const handleApplyToJob = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // In a real app, you would navigate to an application form
    // For now, just show an alert
    Alert.alert(
      'Apply to Job',
      'Would you like to apply to this position?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply',
          onPress: () => {
            Alert.alert('Application Submitted', 'Your application has been submitted successfully!');
          }
        }
      ]
    );
  };

  const handleShareJob = async () => {
    if (!job) return;
    
    try {
      await Share.share({
        message: `Check out this ${job.title} position at ${job.company || job.recruiter?.company_name}!`,
        // In a real app, you would include a deep link to the job
      });
    } catch (error) {
      console.error('Error sharing job:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#666" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.tryAgainButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!job) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Job Details</Text>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveJob}
        >
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? COLORS.primary : "#333"} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUp }]
        }}>
          {/* Company Info */}
          <View style={styles.companySection}>
            <View style={styles.companyHeader}>
              <View style={styles.companyLogo}>
                <Text style={styles.companyInitial}>
                  {(job.company || job.recruiter?.company_name || "").charAt(0)}
                </Text>
              </View>
              
              <View style={styles.companyInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.companyName}>
                  {job.company || job.recruiter?.company_name}
                </Text>
                
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationText}>
                    {job.location}{job.is_remote ? ' • Remote' : ''}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialIcons name="work" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>
                  {job.job_type === 'full_time' ? 'Full Time' : 
                   job.job_type === 'part_time' ? 'Part Time' : 
                   job.job_type === 'contract' ? 'Contract' : 'Internship'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="account-outline" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>
                  {job.experience_level === 'entry' ? 'Entry Level' : 
                   job.experience_level === 'mid' ? 'Mid Level' : 
                   job.experience_level === 'senior' ? 'Senior Level' : 'Executive'}
                </Text>
              </View>
            </View>
            
            {job.salary_min && job.salary_max && (
              <View style={styles.salaryContainer}>
                <MaterialIcons name="attach-money" size={20} color={COLORS.primary} />
                <Text style={styles.salaryText}>
                  ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}/year
                </Text>
              </View>
            )}
          </View>
          
          {/* Job Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
          
          {/* Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.descriptionText}>{job.requirements}</Text>
          </View>
          
          {/* Skill Tags */}
          {job.skills_required && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Skills</Text>
              <View style={styles.skillsContainer}>
                {job.skills_required.split(',').map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Company Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Company</Text>
            <Text style={styles.descriptionText}>
              {job.recruiter?.company_description || 
               `${job.company || job.recruiter?.company_name} is a leading company in the industry, dedicated to innovation and excellence.`}
            </Text>
          </View>
          
          {/* Share button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareJob}
          >
            <Ionicons name="share-social-outline" size={18} color="#666" />
            <Text style={styles.shareButtonText}>Share this job</Text>
          </TouchableOpacity>
          
          {/* Space at bottom to clear the apply button */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
      
      {/* Apply Button (sticky at bottom) */}
      <View style={styles.applyButtonContainer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApplyToJob}
        >
          <Text style={styles.applyButtonText}>Apply for this position</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  tryAgainButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  tryAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  companySection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  companyInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: 12,
    borderRadius: 8,
  },
  salaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillText: {
    color: '#333',
    fontSize: 14,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    marginHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  applyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default JobDetailScreen;