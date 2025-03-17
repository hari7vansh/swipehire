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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['token', 'userType', 'userId']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
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
  
  const RecruiterProfile = ({ profile }) => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company</Text>
        <Text style={styles.sectionText}>{profile.recruiterprofile.company_name}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Position</Text>
        <Text style={styles.sectionText}>{profile.recruiterprofile.position}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Industry</Text>
        <Text style={styles.sectionText}>{profile.recruiterprofile.industry}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Description</Text>
        <Text style={styles.sectionText}>{profile.recruiterprofile.company_description}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Website</Text>
        <Text style={[styles.sectionText, styles.linkText]}>{profile.recruiterprofile.company_website}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, styles.postJobButton]}
        onPress={() => navigation.navigate('CreateJob')}
      >
        <Ionicons name="add-circle-outline" size={20} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Post New Job</Text>
      </TouchableOpacity>
    </>
  );
  
  const JobSeekerProfile = ({ profile }) => (
    <>
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
        <Text style={styles.sectionTitle}>Experience</Text>
        <Text style={styles.sectionText}>{profile.jobseekerprofile.experience_years} years</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        <Text style={styles.sectionText}>{profile.jobseekerprofile.education}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desired Position</Text>
        <Text style={styles.sectionText}>{profile.jobseekerprofile.desired_position}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desired Salary</Text>
        <Text style={styles.sectionText}>
          ${profile.jobseekerprofile.desired_salary?.toLocaleString() || 'Not specified'}
        </Text>
      </View>
    </>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
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
          
          <Text style={styles.username}>@{profile?.user?.username}</Text>
          
          <View style={styles.roleContainer}>
            <Text style={styles.role}>
              {userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{profile?.user?.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{profile?.location || 'No location set'}</Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{profile?.bio || 'No bio available'}</Text>
          </View>
          
          {userType === 'recruiter' ? 
            <RecruiterProfile profile={profile} /> : 
            <JobSeekerProfile profile={profile} />
          }
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.editButton]}
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in a future update.')}
          >
            <Ionicons name="create-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#ff6b6b',
    padding: 20,
    paddingTop: 60,
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
    borderWidth: 1,
    borderColor: 'white',
    marginBottom: 10,
  },
  initials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  roleContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  role: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: -15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#444',
  },
  detailsContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bioSection: {
    marginBottom: 20,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  section: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  linkText: {
    color: '#2196F3',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  skillBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#555',
  },
  actionsContainer: {
    padding: 15,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  postJobButton: {
    backgroundColor: '#2196F3',
    marginVertical: 15,
  },
  logoutButton: {
    backgroundColor: '#f44336',
  },
});

export default ProfileScreen;