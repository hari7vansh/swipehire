import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Sample profile data
const SAMPLE_RECRUITER_PROFILE = {
  id: 1,
  user: {
    username: 'recruiter',
    email: 'recruiter@example.com',
    first_name: 'John',
    last_name: 'Recruiter'
  },
  user_type: 'recruiter',
  bio: 'HR Manager with 7+ years of experience in tech recruitment. Passionate about connecting talented developers with great opportunities.',
  location: 'San Francisco, CA',
  recruiterprofile: {
    company_name: 'Tech Innovations Inc.',
    position: 'HR Manager',
    company_description: 'A leading technology company focused on innovative solutions for the modern business landscape. We pride ourselves on our diverse and talented team.',
    company_website: 'https://techinnovations.example.com',
    industry: 'Technology'
  }
};

const SAMPLE_JOBSEEKER_PROFILE = {
  id: 2,
  user: {
    username: 'jobseeker',
    email: 'jobseeker@example.com',
    first_name: 'Jane',
    last_name: 'Applicant'
  },
  user_type: 'job_seeker',
  bio: 'Full Stack Developer with a passion for building beautiful, responsive web applications. Experienced in React, Node.js, and Python.',
  location: 'New York, NY',
  jobseekerprofile: {
    skills: 'Python, React, JavaScript, Node.js, Express, MongoDB, SQL',
    experience_years: 3,
    education: 'BS Computer Science, University of New York',
    desired_position: 'Senior Full Stack Developer',
    desired_salary: 120000
  }
};

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [280, 120],
    extrapolate: 'clamp'
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 180],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp'
  });
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [100, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [1, 0.6],
    extrapolate: 'clamp'
  });
  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [0, -15],
    extrapolate: 'clamp'
  });
  const avatarTranslateX = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [0, -70],
    extrapolate: 'clamp'
  });
  const nameOpacity = scrollY.interpolate({
    inputRange: [0, 120, 180],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp'
  });
  
  // Tab transition animation - Fixed the issue with tab indicator width
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  
  // Content fade animation
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate tab indicator position
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'about' ? 0 : 1,
      friction: 8,
      tension: 70,
      useNativeDriver: false // Changed to false since we're animating width
    }).start();
    
    // Animate content change
    Animated.sequence([
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true
        }),
        Animated.timing(contentTranslateY, {
          toValue: 20,
          duration: 120,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, [activeTab]);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        setUserType(type);
        
        // In a real app, fetch profile from API
        // For now, use sample data based on user type
        setTimeout(() => {
          if (type === 'recruiter') {
            setProfile(SAMPLE_RECRUITER_PROFILE);
          } else {
            setProfile(SAMPLE_JOBSEEKER_PROFILE);
          }
          setLoading(false);
        }, 600);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  const handleLogout = async () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Haptic feedback for confirmation
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userType');
              await AsyncStorage.removeItem('userId');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };
  
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };
  
  const AboutTab = ({ profile }) => {
    return (
      <Animated.View 
        style={[
          styles.tabContent,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }]
          }
        ]}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Bio</Text>
          </View>
          <Text style={styles.bioText}>{profile?.bio || 'No bio available'}</Text>
        </View>
        
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info-outline" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoText}>{profile?.user?.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoText}>{profile?.location || 'No location set'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoText}>@{profile?.user?.username}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoText}>{userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="settings" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications-outline" size={20} color="white" />
            </View>
            <Text style={styles.settingText}>Notification Preferences</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="white" />
            </View>
            <Text style={styles.settingText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="help-circle-outline" size={20} color="white" />
            </View>
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };
  
  const DetailsTab = ({ profile }) => {
    if (userType === 'recruiter') {
      return (
        <Animated.View 
          style={[
            styles.tabContent,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }]
            }
          ]}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="office-building" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Company Profile</Text>
            </View>
            
            <View style={styles.companyHeader}>
              <View style={styles.companyLogoContainer}>
                <View style={styles.companyLogo}>
                  <Text style={styles.companyLogoText}>
                    {profile.recruiterprofile.company_name.charAt(0)}
                  </Text>
                </View>
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{profile.recruiterprofile.company_name}</Text>
                <Text style={styles.companyIndustry}>{profile.recruiterprofile.industry}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Your Position</Text>
              <Text style={styles.detailValue}>{profile.recruiterprofile.position}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Company Website</Text>
              <TouchableOpacity 
                style={styles.websiteLink}
                onPress={() => {
                  Alert.alert('Open Website', 'This would open the website in your browser.');
                }}
              >
                <Text style={styles.websiteLinkText}>{profile.recruiterprofile.company_website}</Text>
                <Ionicons name="open-outline" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="description" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Company Description</Text>
            </View>
            <Text style={styles.descriptionText}>{profile.recruiterprofile.company_description}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-line" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Recruiting Activity</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>7</Text>
                <Text style={styles.statLabel}>Active Jobs</Text>
              </View>
              <View style={[styles.statItem, styles.statItemBorder]}>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Total Matches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Interviews</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.viewStatsButton}
              onPress={() => Alert.alert('Coming Soon', 'Detailed analytics will be available in a future update.')}
            >
              <Text style={styles.viewStatsButtonText}>View Full Analytics</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    } else {
      return (
        <Animated.View 
          style={[
            styles.tabContent,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }]
            }
          ]}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="code-tags" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            </View>
            <View style={styles.skillsContainer}>
              {profile.jobseekerprofile.skills.split(',').map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="briefcase-clock" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Professional Experience</Text>
            </View>
            
            <View style={styles.experienceItem}>
              <View style={styles.experienceDot} />
              <View style={styles.experienceContent}>
                <Text style={styles.experienceTitle}>Senior Developer</Text>
                <Text style={styles.experienceCompany}>Tech Solutions Inc</Text>
                <Text style={styles.experiencePeriod}>2020 - Present</Text>
                <Text style={styles.experienceDescription}>
                  Led development of multiple web applications using React and Node.js.
                </Text>
              </View>
            </View>
            
            <View style={styles.experienceItem}>
              <View style={styles.experienceDot} />
              <View style={styles.experienceContent}>
                <Text style={styles.experienceTitle}>Web Developer</Text>
                <Text style={styles.experienceCompany}>Digital Innovations</Text>
                <Text style={styles.experiencePeriod}>2018 - 2020</Text>
                <Text style={styles.experienceDescription}>
                  Developed responsive websites and maintained client projects.
                </Text>
              </View>
            </View>
            
            <View style={styles.experienceSummary}>
              <Text style={styles.experienceSummaryText}>
                <Text style={styles.boldText}>{profile.jobseekerprofile.experience_years}</Text> years of professional experience
              </Text>
            </View>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="school" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            <View style={styles.educationItemContainer}>
              <View style={styles.educationItem}>
                <View style={styles.educationIconContainer}>
                  <MaterialCommunityIcons name="school" size={24} color="white" />
                </View>
                <View style={styles.educationContent}>
                  <Text style={styles.educationDegree}>
                    {profile.jobseekerprofile.education.split(',')[0] || "BS Computer Science"}
                  </Text>
                  <Text style={styles.educationSchool}>
                    {profile.jobseekerprofile.education.split(',')[1] || "University of New York"}
                  </Text>
                  <Text style={styles.educationYear}>2014 - 2018</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="trending-up" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Job Preferences</Text>
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIconContainer}>
                <Ionicons name="briefcase" size={18} color="white" />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Desired Position</Text>
                <Text style={styles.preferenceValue}>{profile.jobseekerprofile.desired_position}</Text>
              </View>
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={[styles.preferenceIconContainer, {backgroundColor: '#4CAF50'}]}>
                <FontAwesome5 name="dollar-sign" size={16} color="white" />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Expected Salary</Text>
                <Text style={styles.preferenceValue}>
                  ${profile.jobseekerprofile.desired_salary?.toLocaleString() || 'Not specified'}
                </Text>
              </View>
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={[styles.preferenceIconContainer, {backgroundColor: '#FF9800'}]}>
                <Ionicons name="location" size={18} color="white" />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Preferred Location</Text>
                <Text style={styles.preferenceValue}>{profile.location || 'Not specified'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.primaryLight, COLORS.primary]}
          style={styles.loadingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  // Calculate tab indicator position and width
  const tabWidth = (width - 40) / 2; // Half of tabBar width (accounting for padding)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Hidden header title - appears when scrolling */}
        <Animated.View style={[styles.headerTitle, { opacity: headerTitleOpacity }]}>
          <Text style={styles.headerTitleText}>
            {profile?.user?.first_name} {profile?.user?.last_name}
          </Text>
        </Animated.View>
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert('Coming Soon', 'Settings will be available in a future update.')}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Profile Header Content */}
        <Animated.View style={[styles.profileHeader, { opacity: headerOpacity }]}>
          <Animated.View 
            style={[
              styles.avatarContainer,
              { 
                transform: [
                  { scale: avatarScale },
                  { translateY: avatarTranslateY },
                  { translateX: avatarTranslateX }
                ] 
              }
            ]}
          >
            {profile?.profile_picture ? (
              <Image source={{ uri: profile.profile_picture }} style={styles.profileImage} />
            ) : (
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                style={styles.profileImagePlaceholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.initials}>
                  {getInitials(profile?.user?.first_name, profile?.user?.last_name)}
                </Text>
              </LinearGradient>
            )}
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.profileInfo,
              { opacity: nameOpacity }
            ]}
          >
            <Text style={styles.profileName}>
              {profile?.user?.first_name} {profile?.user?.last_name}
            </Text>
            
            <Text style={styles.profileTitle}>
              {userType === 'recruiter' 
                ? `${profile.recruiterprofile.position} at ${profile.recruiterprofile.company_name}`
                : profile.jobseekerprofile.desired_position
              }
            </Text>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
      
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => setActiveTab('about')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabButtonText, 
            activeTab === 'about' && styles.activeTabButtonText
          ]}>
            About
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => setActiveTab('details')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabButtonText, 
            activeTab === 'details' && styles.activeTabButtonText
          ]}>
            {userType === 'recruiter' ? 'Company' : 'Professional'}
          </Text>
        </TouchableOpacity>
        
        {/* Fixed the tab indicator - now using left property based on activeTab */}
        <Animated.View 
          style={[
            styles.tabIndicator,
            {
              width: tabWidth,
              left: activeTab === 'about' ? 20 : 20 + tabWidth
            }
          ]}
        />
      </View>
      
      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {activeTab === 'about' ? (
          <AboutTab profile={profile} />
        ) : (
          <DetailsTab profile={profile} />
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {userType === 'recruiter' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('CreateJob')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="add-circle-outline" size={20} color="white" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Post New Job</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in a future update.')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentDark]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="create-outline" size={20} color="white" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF4757']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="log-out-outline" size={20} color="white" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONTS.body,
    color: 'white',
    fontWeight: '500',
  },
  header: {
    overflow: 'hidden',
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  headerTitleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  initials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  profileTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    zIndex: 1,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  tabContent: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 30,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyLogoContainer: {
    marginRight: 16,
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  detailRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  websiteLinkText: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    textDecorationLine: 'underline',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: COLORS.border,
    borderRightColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  viewStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  viewStatsButtonText: {
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.3)',
  },
  skillText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  experienceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 10,
  },
  experienceContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  experienceCompany: {
    fontSize: 14,
    color: COLORS.primary,
    marginVertical: 2,
  },
  experiencePeriod: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  experienceDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  experienceSummary: {
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  experienceSummaryText: {
    color: COLORS.text,
    fontSize: 15,
  },
  boldText: {
    fontWeight: 'bold',
  },
  educationItemContainer: {
    marginVertical: 8,
  },
  educationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  educationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  educationContent: {
    flex: 1,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  educationSchool: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  educationYear: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  preferenceValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: COLORS.accent,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  }
});

export default ProfileScreen;