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
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });
  
  useEffect(() => {
    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();
    
    fetchProfileData();
  }, []);
  
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
  
  const renderAboutTab = () => {
    if (!profile) return null;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{profile.bio || 'No bio available'}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoText}>{profile.user.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoText}>{profile.location || 'No location set'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoText}>@{profile.user.username}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoText}>{userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  const renderDetailsTab = () => {
    if (!profile) return null;
    
    if (userType === 'recruiter') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Details</Text>
            
            <View style={styles.companyHeader}>
              <View style={styles.companyLogo}>
                <Text style={styles.companyLogoText}>
                  {profile.recruiterprofile.company_name.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{profile.recruiterprofile.company_name}</Text>
                <Text style={styles.companyIndustry}>{profile.recruiterprofile.industry || 'Technology'}</Text>
                <Text style={styles.companyPosition}>{profile.recruiterprofile.position}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoItem}>
              <MaterialIcons name="description" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Company Description</Text>
                <Text style={styles.infoText}>{profile.recruiterprofile.company_description}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="language" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Website</Text>
                <Text style={styles.infoText}>{profile.recruiterprofile.company_website}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recruitment Activity</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>7</Text>
                <Text style={styles.statLabel}>Active Jobs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Interviews</Text>
              </View>
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.tabContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="work" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Current Title</Text>
                <Text style={styles.infoText}>{profile.jobseekerprofile.desired_position}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-time-eight-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Years of Experience</Text>
                <Text style={styles.infoText}>{profile.jobseekerprofile.experience_years} years</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="school" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Education</Text>
                <Text style={styles.infoText}>{profile.jobseekerprofile.education}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="attach-money" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Expected Salary</Text>
                <Text style={styles.infoText}>
                  ${profile.jobseekerprofile.desired_salary?.toLocaleString() || 'Not specified'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            
            <View style={styles.skillsContainer}>
              {profile.jobseekerprofile.skills.split(',').map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Search Activity</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>42</Text>
                <Text style={styles.statLabel}>Jobs Viewed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>15</Text>
                <Text style={styles.statLabel}>Applications</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
            </View>
          </View>
        </View>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Profile Header */}
      <Animated.View style={[
        styles.header,
        { opacity: headerOpacity }
      ]}>
        <Animated.View style={[
          styles.avatarContainer,
          { transform: [{ scale: avatarScale }] }
        ]}>
          {profile?.profile_picture ? (
            <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {getInitials(profile?.user?.first_name, profile?.user?.last_name)}
              </Text>
            </View>
          )}
        </Animated.View>
        
        <Text style={styles.name}>
          {profile?.user?.first_name} {profile?.user?.last_name}
        </Text>
        
        <Text style={styles.title}>
          {userType === 'recruiter' 
            ? `${profile?.recruiterprofile?.position} at ${profile?.recruiterprofile?.company_name}`
            : profile?.jobseekerprofile?.desired_position
          }
        </Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>{profile?.location}</Text>
        </View>
      </Animated.View>
      
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'about' && styles.activeTab]} 
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'details' && styles.activeTab]} 
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            {userType === 'recruiter' ? 'Company' : 'Professional'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === 'about' ? renderAboutTab() : renderDetailsTab()}
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {userType === 'recruiter' && (
              <TouchableOpacity 
                style={styles.postJobButton}
                onPress={() => navigation.navigate('CreateJob')}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Post New Job</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in a future update.')}
            >
              <Ionicons name="create-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
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
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  companyIndustry: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  companyPosition: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    margin: 16,
  },
  postJobButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ProfileScreen;