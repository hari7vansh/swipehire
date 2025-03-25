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
  
  // Tab transition animation
  const tabTranslateX = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate tab indicator position
    Animated.timing(tabTranslateX, {
      toValue: activeTab === 'about' ? 0 : width / 2,
      duration: 300,
      useNativeDriver: true
    }).start();
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
        }, 800);
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
    // Content fade-in animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    
    useEffect(() => {
      if (activeTab === 'about') {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ]).start();
      } else {
        fadeAnim.setValue(0);
        translateY.setValue(20);
      }
    }, [activeTab]);
    
    return (
      <Animated.View 
        style={[
          styles.tabContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY }]
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
      </Animated.View>
    );
  };
  
  const DetailsTab = ({ profile }) => {
    // Content fade-in animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    
    useEffect(() => {
      if (activeTab === 'details') {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ]).start();
      } else {
        fadeAnim.setValue(0);
        translateY.setValue(20);
      }
    }, [activeTab]);
    
    if (userType === 'recruiter') {
      return (
        <Animated.View 
          style={[
            styles.tabContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="office-building" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Company Details</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Company Name</Text>
              <Text style={styles.detailValue}>{profile.recruiterprofile.company_name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Your Position</Text>
              <Text style={styles.detailValue}>{profile.recruiterprofile.position}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Industry</Text>
              <Text style={styles.detailValue}>{profile.recruiterprofile.industry}</Text>
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
              <MaterialCommunityIcons name="web" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Website</Text>
            </View>
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
        </Animated.View>
      );
    } else {
      return (
        <Animated.View 
          style={[
            styles.tabContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="code-tags" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Skills</Text>
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
              <Text style={styles.sectionTitle}>Professional</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Experience</Text>
              <Text style={styles.detailValue}>{profile.jobseekerprofile.experience_years} years</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Desired Position</Text>
              <Text style={styles.detailValue}>{profile.jobseekerprofile.desired_position}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected Salary</Text>
              <Text style={styles.detailValue}>
                ${profile.jobseekerprofile.desired_salary?.toLocaleString() || 'Not specified'}
              </Text>
            </View>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="school" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            <Text style={styles.educationText}>{profile.jobseekerprofile.education}</Text>
          </View>
        </Animated.View>
      );
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={StyleSheet.absoluteFill}
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
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.initials}>
                  {getInitials(profile?.user?.first_name, profile?.user?.last_name)}
                </Text>
              </View>
            )}
          </Animated.View>
          
          <View style={styles.profileInfo}>
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
          </View>
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
        
        <Animated.View 
          style={[
            styles.tabIndicator,
            {
              transform: [{ translateX: tabTranslateX }]
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    left: 0,
    width: width / 2,
    height: 3,
    backgroundColor: COLORS.primary,
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
  educationText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
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