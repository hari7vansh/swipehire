import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { matchingAPI, jobsAPI } from '../services/api';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const ROTATION_ANGLE = 12; // Degrees to rotate when swiping

// Sample data for jobs and candidates
const SAMPLE_JOBS = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "Tech Innovations Inc.",
    location: "San Francisco, CA",
    description: "We're looking for a talented frontend developer to join our team. You'll work on building responsive user interfaces and implementing new features.",
    requirements: "Strong knowledge of React and JavaScript. Experience with modern frontend frameworks. Understanding of UI/UX principles.",
    salary_min: 80000,
    salary_max: 120000,
    job_type: "full_time",
    experience_level: "mid",
    recruiter: {
      id: 1,
      company_name: "Tech Innovations Inc."
    }
  },
  {
    id: 2,
    title: "Backend Engineer",
    company: "DataFlow Systems",
    location: "Remote",
    description: "Join our team to build scalable backend systems that power our applications. You'll work with databases, APIs, and server infrastructure.",
    requirements: "Experience with Python, Django, and RESTful APIs. Knowledge of database design and optimization.",
    salary_min: 100000,
    salary_max: 150000,
    job_type: "full_time",
    experience_level: "senior",
    is_remote: true,
    recruiter: {
      id: 2,
      company_name: "DataFlow Systems"
    }
  },
  {
    id: 3,
    title: "Mobile Developer",
    company: "AppWorks Studios",
    location: "Seattle, WA",
    description: "Work on our mobile applications for iOS and Android using React Native. You'll be responsible for building new features and maintaining existing code.",
    requirements: "Experience with React Native and mobile app development. Understanding of mobile UX patterns.",
    salary_min: 90000,
    salary_max: 130000,
    job_type: "full_time",
    experience_level: "mid",
    recruiter: {
      id: 3,
      company_name: "AppWorks Studios"
    }
  }
];

const SAMPLE_CANDIDATES = [
  {
    id: 1,
    first_name: "Alex",
    last_name: "Johnson",
    title: "Senior Frontend Developer",
    skills: "React, JavaScript, TypeScript, CSS, HTML",
    experience_years: 5,
    education: "BS Computer Science, Stanford University",
    bio: "Passionate frontend developer with 5 years of experience building web applications."
  },
  {
    id: 2,
    first_name: "Sarah",
    last_name: "Williams",
    title: "Backend Engineer",
    skills: "Python, Django, Flask, SQL, AWS",
    experience_years: 4,
    education: "MS Computer Engineering, MIT",
    bio: "Backend developer specializing in building scalable APIs and services."
  },
  {
    id: 3,
    first_name: "Michael",
    last_name: "Chen",
    title: "Full Stack Developer",
    skills: "JavaScript, React, Node.js, MongoDB, Express",
    experience_years: 6,
    education: "BS Software Engineering, UC Berkeley",
    bio: "Full stack developer experienced in building complete web applications from frontend to backend."
  }
];

const SwipeScreen = ({ navigation }) => {
  // State
  const [data, setData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('about');

  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [`-${ROTATION_ANGLE}deg`, '0deg', `${ROTATION_ANGLE}deg`],
    extrapolate: 'clamp'
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.92, 1],
    extrapolate: 'clamp'
  });
  
  // Card animation values - using transform instead of height
  const expandAnim = useRef(new Animated.Value(0)).current;
  const cardScaleY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
    extrapolate: 'clamp'
  });
  const cardTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.08],
    extrapolate: 'clamp'
  });
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const detailsOpacity = expandAnim;

  // Button scale animations
  const buttonScales = useRef({
    left: new Animated.Value(1),
    right: new Animated.Value(1),
    refresh: new Animated.Value(1)
  }).current;

  // Refs
  const swipeInProgress = useRef(false);
  const dataRef = useRef(data); // Reference to data for access in callbacks
  const currIndexRef = useRef(currentIndex); // Reference to currentIndex for access in callbacks

  // Update refs when state changes
  useEffect(() => {
    dataRef.current = data;
    currIndexRef.current = currentIndex;
  }, [data, currentIndex]);

  // Fetch user data and initial card data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        setUserType(type);
        
        // In real app, fetch data from API
        // For now use sample data
        setData(type === 'job_seeker' ? SAMPLE_JOBS : SAMPLE_CANDIDATES);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData(SAMPLE_JOBS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swipeInProgress.current && !expanded,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !swipeInProgress.current && !expanded &&
               (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10);
      },
      onPanResponderGrant: () => {
        position.setOffset({
          x: position.x._value,
          y: position.y._value
        });
        position.setValue({ x: 0, y: 0 });
        
        // Fade content immediately for better performance
        Animated.timing(contentOpacity, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit vertical movement and prioritize horizontal
        const dx = gestureState.dx;
        const dy = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 
          ? gestureState.dy * 0.1 // When primarily horizontal, greatly dampen vertical
          : gestureState.dy * 0.4; // Otherwise just dampen slightly
        
        // Update position
        position.setValue({ x: dx, y: dy });
        
        // Update swipe direction for UI feedback
        if (dx > SWIPE_THRESHOLD / 3) {
          setSwipeDirection('right');
        } else if (dx < -SWIPE_THRESHOLD / 3) {
          setSwipeDirection('left');
        } else {
          setSwipeDirection(null);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        position.flattenOffset();
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeCard('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeCard('left');
        } else {
          resetCardPosition();
        }
      }
    })
  ).current;

  // Reset card position with animation
  const resetCardPosition = () => {
    setSwipeDirection(null);
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        tension: 50,
        useNativeDriver: true
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  // Swipe card with animation
  const swipeCard = (direction) => {
    if (swipeInProgress.current) return;
    swipeInProgress.current = true;
    
    // Trigger haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(
        direction === 'right' 
          ? Haptics.ImpactFeedbackStyle.Medium 
          : Haptics.ImpactFeedbackStyle.Light
      );
    } else {
      Vibration.vibrate(direction === 'right' ? 30 : 20);
    }
    
    // Set swipe direction for UI
    setSwipeDirection(direction);
    
    // Calculate swipe destination
    const xDestination = direction === 'right' ? width * 1.5 : -width * 1.5;
    
    // Animate swipe
    Animated.timing(position, {
      toValue: { x: xDestination, y: direction === 'right' ? -60 : 60 },
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      // After animation completes
      handleSwipeComplete(direction);
    });
  };

  // Handle swipe completion
  const handleSwipeComplete = async (direction) => {
    const currentItem = dataRef.current[currIndexRef.current];
    
    // Record swipe action to API
    try {
      if (userType === 'job_seeker') {
        await matchingAPI.swipe({
          direction,
          job_id: currentItem.id
        });
        
        // Check for match on right swipe (for demo, random 30% chance)
        if (direction === 'right' && Math.random() < 0.3) {
          setTimeout(() => showMatchAlert(currentItem), 500);
        }
      } else {
        await matchingAPI.swipe({
          direction,
          job_seeker_id: currentItem.id,
          job_id: 1 // This would need to be dynamic in a real app
        });
        
        // Check for match on right swipe (for demo, random 30% chance)
        if (direction === 'right' && Math.random() < 0.3) {
          setTimeout(() => showMatchAlert(currentItem), 500);
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
    
    // Move to next card
    setCurrentIndex(prevIndex => prevIndex + 1);
    
    // Reset position and animation state
    position.setValue({ x: 0, y: 0 });
    setSwipeDirection(null);
    swipeInProgress.current = false;
    
    // Reset expanded state and opacity
    if (expanded) {
      toggleCardExpansion();
    }
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  // Show match alert
  const showMatchAlert = (item) => {
    // Play haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate([0, 80, 100, 80]);
    }
    
    // Format alert based on user type
    const title = "It's a Match! 🎉";
    const message = userType === 'job_seeker'
      ? `Congratulations! You matched with ${item.company || item.recruiter?.company_name} for the ${item.title} position.`
      : `Congratulations! You matched with ${item.first_name} ${item.last_name} for your job position.`;
    
    Alert.alert(
      title,
      message,
      [
        { 
          text: "View Matches", 
          onPress: () => navigation.navigate('Matches'),
          style: "default" 
        },
        { text: "Keep Swiping", style: "cancel" }
      ]
    );
  };

  // Reset cards
  const refreshCards = () => {
    setRefreshing(true);
    
    // Show feedback
    animateButtonScale('refresh');
    
    // Animated reset
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      // Reset state
      setCurrentIndex(0);
      setSwipeDirection(null);
      
      // End refreshing state after a short delay
      setTimeout(() => {
        setRefreshing(false);
      }, 600);
    });
  };

  // Toggle card expansion for details
  const toggleCardExpansion = () => {
    if (expanded) {
      // Contract card
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Expand card
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
    setExpanded(!expanded);
  };

  // Animate button scale on press
  const animateButtonScale = (button) => {
    Animated.sequence([
      Animated.timing(buttonScales[button], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.spring(buttonScales[button], {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  // Manual swipe buttons
  const handleButtonSwipe = (direction) => {
    if (currentIndex >= data.length || loading || refreshing || swipeInProgress.current || expanded) return;
    
    // Animate button scale
    animateButtonScale(direction === 'left' ? 'left' : 'right');
    
    // Swipe card
    swipeCard(direction);
  };

  /* Render Functions */
  const renderJobCard = (job) => {
    return (
      <View style={styles.cardContent}>
        {/* Card Header */}
        <Animated.View 
          style={[
            styles.cardHeader, 
            { opacity: contentOpacity }
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.companyInitial}>
              <Text style={styles.initialText}>
                {(job.company || job.recruiter?.company_name || "").charAt(0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerTextContent}>
            <Text style={styles.cardTitle}>{job.title}</Text>
            <Text style={styles.companyName}>{job.company || job.recruiter?.company_name}</Text>
            <View style={styles.locationWrapper}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.location}>
                {job.location}
                {job.is_remote && " • Remote"}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Expand/Collapse Button */}
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={toggleCardExpansion}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={22} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {/* Card Body - Summary Content */}
        <Animated.View 
          style={[
            styles.cardBody, 
            { opacity: contentOpacity }
          ]}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the role:</Text>
            <Text style={styles.description} numberOfLines={4}>
              {job.description}
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements:</Text>
            <Text style={styles.description} numberOfLines={2}>
              {job.requirements}
            </Text>
          </View>
          
          {job.salary_min && job.salary_max && (
            <View style={styles.salaryContainer}>
              <MaterialIcons name="attach-money" size={18} color={COLORS.primary} />
              <Text style={styles.salary}>
                ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
              </Text>
            </View>
          )}
        </Animated.View>
        
        {/* Card Footer */}
        <Animated.View 
          style={[
            styles.cardFooter,
            { opacity: contentOpacity }
          ]}
        >
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {job.job_type === 'full_time' ? 'Full Time' : 
                job.job_type === 'part_time' ? 'Part Time' : 
                job.job_type === 'contract' ? 'Contract' : 'Internship'}
              </Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {job.experience_level === 'entry' ? 'Entry Level' : 
                job.experience_level === 'mid' ? 'Mid Level' : 
                job.experience_level === 'senior' ? 'Senior Level' : 'Executive'}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Detailed Card Content - Only visible when expanded */}
        <Animated.View 
          style={[
            styles.detailedContent,
            { 
              opacity: detailsOpacity,
              display: expandAnim._value > 0 ? 'flex' : 'none'
            }
          ]}
        >
          <View style={styles.detailTabContainer}>
            <TouchableOpacity 
              style={[
                styles.detailTab, 
                activeSection === 'about' && styles.activeDetailTab
              ]}
              onPress={() => setActiveSection('about')}
            >
              <Text style={[
                styles.detailTabText,
                activeSection === 'about' && styles.activeDetailTabText
              ]}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.detailTab,
                activeSection === 'requirements' && styles.activeDetailTab
              ]}
              onPress={() => setActiveSection('requirements')}
            >
              <Text style={[
                styles.detailTabText,
                activeSection === 'requirements' && styles.activeDetailTabText
              ]}>Requirements</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.detailTab,
                activeSection === 'company' && styles.activeDetailTab
              ]}
              onPress={() => setActiveSection('company')}
            >
              <Text style={[
                styles.detailTabText,
                activeSection === 'company' && styles.activeDetailTabText
              ]}>Company</Text>
            </TouchableOpacity>
          </View>
          
          {activeSection === 'about' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Job Description</Text>
              <Text style={styles.detailText}>{job.description}</Text>
              
              <View style={styles.detailInfoRow}>
                <View style={styles.detailInfoItem}>
                  <MaterialIcons name="work" size={20} color={COLORS.primary} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Job Type</Text>
                    <Text style={styles.detailInfoValue}>
                      {job.job_type === 'full_time' ? 'Full Time' : 
                       job.job_type === 'part_time' ? 'Part Time' : 
                       job.job_type === 'contract' ? 'Contract' : 'Internship'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailInfoItem}>
                  <MaterialCommunityIcons name="medal-outline" size={20} color={COLORS.primary} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Experience</Text>
                    <Text style={styles.detailInfoValue}>
                      {job.experience_level === 'entry' ? 'Entry Level' : 
                       job.experience_level === 'mid' ? 'Mid Level' : 
                       job.experience_level === 'senior' ? 'Senior Level' : 'Executive'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.detailInfoRow}>
                <View style={styles.detailInfoItem}>
                  <MaterialIcons name="attach-money" size={18} color={COLORS.primary} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Salary Range</Text>
                    <Text style={styles.detailInfoValue}>
                      ${job.salary_min?.toLocaleString() || 'N/A'} - ${job.salary_max?.toLocaleString() || 'N/A'}/year
                    </Text>
                  </View>
                </View>
                <View style={styles.detailInfoItem}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Location</Text>
                    <Text style={styles.detailInfoValue}>
                      {job.location}{job.is_remote ? ' (Remote)' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {activeSection === 'requirements' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Requirements</Text>
              <Text style={styles.detailText}>{job.requirements}</Text>
            </View>
          )}
          
          {activeSection === 'company' && (
            <View style={styles.detailSection}>
              <View style={styles.companyDetailHeader}>
                <View style={styles.companyDetailLogoContainer}>
                  <View style={styles.companyDetailInitial}>
                    <Text style={styles.companyDetailInitialText}>
                      {(job.company || job.recruiter?.company_name || "").charAt(0)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.companyDetailName}>{job.company || job.recruiter?.company_name}</Text>
              </View>
              
              <Text style={styles.detailSectionTitle}>About the Company</Text>
              <Text style={styles.detailText}>
                {job.recruiter?.company_description || 
                 `${job.company || job.recruiter?.company_name} is a leading company in the industry, dedicated to innovation and excellence.`}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };
  
  // Render candidate card
  const renderCandidateCard = (candidate) => {
    return (
      <View style={styles.cardContent}>
        {/* Card Header */}
        <Animated.View 
          style={[
            styles.cardHeader, 
            styles.candidateHeader,
            { opacity: contentOpacity }
          ]}
        >
          <View style={styles.candidateImageContainer}>
            <View style={styles.candidateImagePlaceholder}>
              <Text style={styles.candidateInitialText}>{candidate.first_name.charAt(0)}</Text>
            </View>
          </View>
          
          <View style={styles.headerTextContent}>
            <Text style={styles.cardTitle}>{candidate.first_name} {candidate.last_name}</Text>
            <Text style={styles.companyName}>{candidate.title}</Text>
            <View style={styles.locationWrapper}>
              <MaterialIcons name="work-outline" size={16} color="#666" />
              <Text style={styles.location}>
                {candidate.experience_years} years experience
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Expand/Collapse Button */}
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={toggleCardExpansion}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={22} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {/* Card Body - Summary Content */}
        <Animated.View 
          style={[
            styles.cardBody, 
            { opacity: contentOpacity }
          ]}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About:</Text>
            <Text style={styles.description} numberOfLines={3}>
              {candidate.bio}
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills:</Text>
            <View style={styles.skillsContainer}>
              {candidate.skills.split(',').map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{skill.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education:</Text>
            <Text style={styles.description} numberOfLines={2}>
              {candidate.education}
            </Text>
          </View>
        </Animated.View>
        
        {/* Detailed Card Content - Only visible when expanded */}
        <Animated.View 
          style={[
            styles.detailedContent,
            { 
              opacity: detailsOpacity,
              display: expandAnim._value > 0 ? 'flex' : 'none'
            }
          ]}
        >
          <View style={styles.detailTabContainer}>
            <TouchableOpacity 
              style={[
                styles.detailTab, 
                activeSection === 'about' && styles.activeDetailTab
              ]}
              onPress={() => setActiveSection('about')}
            >
              <Text style={[
                styles.detailTabText,
                activeSection === 'about' && styles.activeDetailTabText
              ]}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.detailTab,
                activeSection === 'skills' && styles.activeDetailTab
              ]}
              onPress={() => setActiveSection('skills')}
            >
              <Text style={[
                styles.detailTabText,
                activeSection === 'skills' && styles.activeDetailTabText
              ]}>Skills</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.detailTab,
                activeSection === 'education' && styles.activeDetailTab
              ]}
              onPress={() => setActiveSection('education')}
            >
              <Text style={[
                styles.detailTabText,
                activeSection === 'education' && styles.activeDetailTabText
              ]}>Education</Text>
            </TouchableOpacity>
          </View>
          
          {activeSection === 'about' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Biography</Text>
              <Text style={styles.detailText}>{candidate.bio}</Text>
              
              <View style={styles.detailInfoRow}>
                <View style={styles.detailInfoItem}>
                  <MaterialIcons name="work" size={20} color={COLORS.primary} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Current Title</Text>
                    <Text style={styles.detailInfoValue}>{candidate.title}</Text>
                  </View>
                </View>
                <View style={styles.detailInfoItem}>
                  <MaterialCommunityIcons name="certificate-outline" size={20} color={COLORS.primary} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Experience</Text>
                    <Text style={styles.detailInfoValue}>{candidate.experience_years} years</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {activeSection === 'skills' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Technical Skills</Text>
              <View style={styles.detailSkillContainer}>
                {candidate.skills.split(',').map((skill, idx) => (
                  <View style={styles.detailSkillBadge} key={idx}>
                    <Text style={styles.detailSkillText}>{skill.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {activeSection === 'education' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Education</Text>
              <View style={styles.educationItem}>
                <View style={styles.educationDot} />
                <View style={styles.educationContent}>
                  <Text style={styles.educationDegree}>{candidate.education.split(',')[0] || "BS Computer Science"}</Text>
                  <Text style={styles.educationSchool}>{candidate.education.split(',')[1] || "Stanford University"}</Text>
                  <Text style={styles.educationYear}>2015 - 2019</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };
  
  // Render card
  const renderCard = () => {
    if (loading) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding your perfect matches...</Text>
        </View>
      );
    }
    
    if (refreshing) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Refreshing...</Text>
        </View>
      );
    }
    
    if (currentIndex >= data.length) {
      return (
        <View style={[styles.card, styles.endOfCards]}>
          <Ionicons name="checkmark-circle-outline" size={60} color={COLORS.primary} />
          <Text style={styles.endOfCardsText}>No more profiles</Text>
          <Text style={styles.endOfCardsSubtext}>
            You've seen all available {userType === 'job_seeker' ? 'jobs' : 'candidates'}.
            Check back later for new matches!
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshCards}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>Start Over</Text>
            <Ionicons name="refresh" size={20} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      );
    }
    
    const item = data[currentIndex];
    
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card, 
          { 
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
              { scaleY: cardScaleY },
              { translateY: cardTranslateY }
            ],
            zIndex: 2
          }
        ]}
      >
        {userType === 'job_seeker' ? renderJobCard(item) : renderCandidateCard(item)}
        
        {/* Swipe indicators */}
        <Animated.View 
          style={[
            styles.swipeIndicator, 
            styles.likeIndicator,
            { opacity: likeOpacity }
          ]}
        >
          <MaterialCommunityIcons name="thumb-up" size={36} color="white" />
          <Text style={styles.indicatorText}>LIKE</Text>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.swipeIndicator, 
            styles.nopeIndicator,
            { opacity: nopeOpacity }
          ]}
        >
          <MaterialCommunityIcons name="thumb-down" size={36} color="white" />
          <Text style={styles.indicatorText}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    );
  };
  
  // Render next card
  const renderNextCard = () => {
    if (currentIndex >= data.length - 1 || loading || refreshing) {
      return null;
    }
    
    const nextItem = data[currentIndex + 1];
    
    return (
      <Animated.View 
        style={[
          styles.card, 
          styles.nextCard,
          {
            transform: [{ scale: nextCardScale }],
            opacity: 0.7,
            zIndex: 1
          }
        ]}
      >
        <View style={styles.nextCardContent}>
          <View style={styles.nextCardHeader}>
            <Text style={styles.nextCardTitle}>
              {userType === 'job_seeker' 
                ? nextItem.title 
                : `${nextItem.first_name} ${nextItem.last_name}`}
            </Text>
            <Text style={styles.nextCardSubtitle}>
              {userType === 'job_seeker' 
                ? (nextItem.company || nextItem.recruiter?.company_name)
                : nextItem.title}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userType === 'job_seeker' ? 'Find Jobs' : 'Find Candidates'}
        </Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={26} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Cards */}
      <View style={styles.cardContainer}>
        {renderNextCard()}
        {renderCard()}
      </View>
      
      {/* Swipe Buttons */}
      {!loading && !refreshing && currentIndex < data.length && (
        <View style={styles.buttonsContainer}>
          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                transform: [{ scale: buttonScales.left }]
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.button, styles.buttonLeft, swipeDirection === 'left' && styles.buttonLeftActive]} 
              onPress={() => handleButtonSwipe('left')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="thumb-down" size={28} color="white" />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                transform: [{ scale: buttonScales.refresh }]
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.button, styles.buttonMiddle]} 
              onPress={refreshCards}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={24} color="white" />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                transform: [{ scale: buttonScales.right }]
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.button, styles.buttonRight, swipeDirection === 'right' && styles.buttonRightActive]} 
              onPress={() => handleButtonSwipe('right')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="thumb-up" size={28} color="white" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F0F4F8',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  card: {
    position: 'absolute',
    width: width * 0.9,
    height: height * 0.68,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  candidateHeader: {
    paddingTop: 20,
    alignItems: 'flex-start', 
  },
  logoContainer: {
    marginRight: 15,
  },
  companyInitial: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  candidateImageContainer: {
    marginRight: 15,
  },
  candidateImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateInitialText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 6,
  },
  expandButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  cardBody: {
    flex: 1,
    padding: 16,
    paddingTop: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  salary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  skillBadge: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillBadgeText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  detailedContent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    zIndex: 5,
  },
  detailTabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeDetailTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  detailTabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeDetailTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  detailSection: {
    flex: 1,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    marginTop: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 15,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  detailInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
  },
  detailInfoContent: {
    marginLeft: 8,
  },
  detailInfoLabel: {
    fontSize: 12,
    color: '#666666',
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  detailSkillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailSkillBadge: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailSkillText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  companyDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  companyDetailLogoContainer: {
    marginRight: 15,
  },
  companyDetailInitial: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyDetailInitialText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  companyDetailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  educationItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  educationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 10,
  },
  educationContent: {
    flex: 1,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  educationSchool: {
    fontSize: 14,
    color: '#666666',
    marginVertical: 2,
  },
  educationYear: {
    fontSize: 12,
    color: '#999999',
  },
  nextCard: {
    top: 10,
    backgroundColor: '#FFFFFF',
  },
  nextCardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nextCardHeader: {
    padding: 20,
    paddingTop: 30,
  },
  nextCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  nextCardSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  swipeIndicator: {
    position: 'absolute',
    padding: 10,
    paddingHorizontal: 12,
    borderWidth: 3,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-30deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  likeIndicator: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.85)',
    right: 25,
    top: 35,
  },
  nopeIndicator: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.85)',
    left: 25,
    top: 35,
  },
  indicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  buttonWrapper: {
    // Empty wrapper for button scale animations
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonLeft: {
    backgroundColor: '#FF5252',
  },
  buttonLeftActive: {
    backgroundColor: '#D32F2F',
  },
  buttonMiddle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#9E9E9E',
  },
  buttonRight: {
    backgroundColor: '#4CAF50',
  },
  buttonRightActive: {
    backgroundColor: '#388E3C',
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginTop: 20,
  },
  endOfCards: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  endOfCardsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginVertical: 15,
  },
  endOfCardsSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SwipeScreen;