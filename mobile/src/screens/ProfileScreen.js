import React, { useState, useEffect } from 'react';
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
  StatusBar, // Added StatusBar import
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

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
  const scrollY = new Animated.Value(0);
  
  // Animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [200, 120],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp'
  });
  
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp'
  });
  
  const titleSize = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 20],
    extrapolate: 'clamp'
  });
  
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
            try {
              await AsyncStorage.removeItem('token');
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
      <View style={styles.tabContent}>
        <View style={styles.sectionCard}>
          <Text style={styles.bioText}>{profile?.bio || 'No bio available'}</Text>
        </View>
        
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primaryDark} />
            <Text style={styles.infoText}>{profile?.user?.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.primaryDark} />
            <Text style={styles.infoText}>{profile?.location || 'No location set'}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const DetailsTab = ({ profile }) => {
    if (userType === 'recruiter') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="office-building" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Company</Text>
            </View>
            <Text style={styles.sectionText}>{profile.recruiterprofile.company_name}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="briefcase" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Position</Text>
            </View>
            <Text style={styles.sectionText}>{profile.recruiterprofile.position}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="tag-multiple" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Industry</Text>
            </View>
            <Text style={styles.sectionText}>{profile.recruiterprofile.industry}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="information" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Company Description</Text>
            </View>
            <Text style={styles.sectionText}>{profile.recruiterprofile.company_description}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="web" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Website</Text>
            </View>
            <Text style={[styles.sectionText, styles.linkText]}>{profile.recruiterprofile.company_website}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="code-tags" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Skills</Text>
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
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="briefcase-clock" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Experience</Text>
            </View>
            <Text style={styles.sectionText}>{profile.jobseekerprofile.experience_years} years</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="school" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Education</Text>
            </View>
            <Text style={styles.sectionText}>{profile.jobseekerprofile.education}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="target" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Desired Position</Text>
            </View>
            <Text style={styles.sectionText}>{profile.jobseekerprofile.desired_position}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="cash" size={22} color={COLORS.primaryDark} />
              <Text style={styles.sectionLabel}>Desired Salary</Text>
            </View>
            <Text style={styles.sectionText}>
              ${profile.jobseekerprofile.desired_salary?.toLocaleString() || 'Not specified'}
            </Text>
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
      <StatusBar barStyle="light-content" />
      
      {/* Header section with animation */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Header content that fades out when scrolling */}
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          {profile?.profile_picture ? (
            <Image source={{ uri: profile.profile_picture }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.initials}>
                {getInitials(profile?.user?.first_name, profile?.user?.last_name)}
              </Text>
            </View>
          )}
          
          <Text style={styles.name}>
            {profile?.user?.first_name} {profile?.user?.last_name}
          </Text>
          
          <View style={styles.roleContainer}>
            <Text style={styles.role}>
              {userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'}
            </Text>
          </View>
        </Animated.View>
        
        {/* Compact header title that appears when scrolling */}
        <Animated.View 
          style={[
            styles.compactHeader, 
            { 
              opacity: titleOpacity,
            }
          ]}
        >
          <Animated.Text style={[styles.compactHeaderText, { fontSize: titleSize }]}>
            {profile?.user?.first_name} {profile?.user?.last_name}
          </Animated.Text>
        </Animated.View>
        
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Settings button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert('Coming Soon', 'Settings will be available in a future update.')}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Tab navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'about' && styles.activeTabButton]} 
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'about' && styles.activeTabButtonText]}>
            About
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'details' && styles.activeTabButton]} 
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'details' && styles.activeTabButtonText]}>
            {userType === 'recruiter' ? 'Company Details' : 'Professional Details'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Scrollable content */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
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
        
        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {userType === 'recruiter' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('CreateJob')}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Post New Job</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in a future update.')}
          >
            <Ionicons name="create-outline" size={20} color="white" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
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
    marginTop: 10,
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  compactHeader: {
    position: 'absolute',
    bottom: 10,
    left: 80,
    right: 80,
    alignItems: 'center',
  },
  compactHeaderText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.l + (Platform.OS === 'ios' ? 0 : StatusBar.currentHeight),
    left: SPACING.m,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: SPACING.l + (Platform.OS === 'ios' ? 0 : StatusBar.currentHeight),
    right: SPACING.m,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 10,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 10,
  },
  initials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: FONTS.h1,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  roleContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  role: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.body,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  tabContent: {
    padding: SPACING.m,
  },
  sectionCard: {
    ...SHADOWS.small,
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.l,
    marginBottom: SPACING.m,
  },
  bioText: {
    fontSize: FONTS.body,
    lineHeight: 24,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: FONTS.body,
    color: COLORS.text,
    marginLeft: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: FONTS.body,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginLeft: 8,
  },
  sectionText: {
    fontSize: FONTS.body,
    color: COLORS.text,
    lineHeight: 22,
    paddingLeft: 30,
  },
  linkText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    paddingLeft: 30,
  },
  skillBadge: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.3)',
  },
  skillText: {
    color: COLORS.primary,
    fontSize: FONTS.label,
  },
  actionsContainer: {
    padding: SPACING.l,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    marginBottom: SPACING.m,
    ...SHADOWS.small,
  },
  actionButtonIcon: {
    marginRight: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: COLORS.accent,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  },
});

export default ProfileScreen;