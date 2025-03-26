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
  Platform,
  Easing,
  Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { matchingAPI, jobsAPI } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const ROTATION_ANGLE = 12; // Degrees to rotate when swiping
const CARD_OPACITY = 0.9; // Secondary card opacity

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
  },
  {
    id: 4,
    title: "UX/UI Designer",
    company: "Creative Solutions",
    location: "New York, NY",
    description: "Design beautiful and intuitive user experiences for our products. Work closely with developers to implement your designs.",
    requirements: "Proficiency in design tools like Figma or Sketch. Portfolio showing UI/UX projects. Understanding of user-centered design principles.",
    salary_min: 85000,
    salary_max: 125000,
    job_type: "full_time",
    experience_level: "mid",
    recruiter: {
      id: 4,
      company_name: "Creative Solutions"
    }
  },
  {
    id: 5,
    title: "DevOps Engineer",
    company: "CloudTech Services",
    location: "Austin, TX",
    description: "Manage our cloud infrastructure and CI/CD pipelines. Ensure reliability, performance, and security of our systems.",
    requirements: "Experience with AWS, Docker, and Kubernetes. Knowledge of CI/CD practices and tools.",
    salary_min: 110000,
    salary_max: 160000,
    job_type: "full_time",
    experience_level: "senior",
    recruiter: {
      id: 5,
      company_name: "CloudTech Services"
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
  },
  {
    id: 4,
    first_name: "Emily",
    last_name: "Taylor",
    title: "UX/UI Designer",
    skills: "Figma, Sketch, Adobe XD, HTML, CSS",
    experience_years: 3,
    education: "BFA Design, Rhode Island School of Design",
    bio: "Designer focused on creating intuitive and beautiful user experiences."
  },
  {
    id: 5,
    first_name: "David",
    last_name: "Miller",
    title: "Mobile Developer",
    skills: "React Native, Swift, Kotlin, Firebase",
    experience_years: 4,
    education: "BS Computer Science, University of Washington",
    bio: "Mobile developer with experience in both native and cross-platform development."
  }
];

// Use background gradient colors instead of images
const BACKGROUND_COLORS = {
  "tech": ['#2193b0', '#6dd5ed'],
  "finance": ['#373B44', '#4286f4'],
  "design": ['#834d9b', '#d04ed6'],
  "default": ['#4b6cb7', '#182848'],
};

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
  const nextCardOpacity = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, CARD_OPACITY, 1],
    extrapolate: 'clamp'
  });
  
  // Card animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const cardHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.68, height * 0.85],
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
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: xDestination, y: direction === 'right' ? -60 : 60 },
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp)
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
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
        const response = await matchingAPI.swipe({
          direction,
          job_id: currentItem.id
        });
        
        // Check for match on right swipe (for demo, random 30% chance)
        if (direction === 'right' && Math.random() < 0.3) {
          setTimeout(() => showMatchAlert(currentItem), 500);
        }
      } else {
        const response = await matchingAPI.swipe({
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
          useNativeDriver: false
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
          useNativeDriver: false
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

  // Render job card
  const renderJobCard = (job) => {
    // Determine background colors based on company
    const companyLower = job.company?.toLowerCase() || job.recruiter?.company_name?.toLowerCase() || '';
    let backgroundColors = BACKGROUND_COLORS.default;
    
    if (companyLower.includes('tech') || companyLower.includes('data') || companyLower.includes('app')) {
      backgroundColors = BACKGROUND_COLORS.tech;
    } else if (companyLower.includes('creative') || companyLower.includes('design')) {
      backgroundColors = BACKGROUND_COLORS.design;
    } else if (companyLower.includes('finance') || companyLower.includes('bank')) {
      backgroundColors = BACKGROUND_COLORS.finance;
    }
    
    return (
      <View style={styles.cardContent}>
        {/* Background Gradient */}
        <LinearGradient
          colors={backgroundColors}
          style={styles.cardBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
          style={styles.cardGradient}
        />
        
        {/* Card Header */}
        <Animated.View 
          style={[
            styles.cardHeader, 
            { opacity: contentOpacity }
          ]}
        >
          {/* Company logo or initial */}
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
              <Ionicons name="location-outline" size={16} color="#fff" />
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
            color="#fff" 
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
              <FontAwesome5 name="money-bill-wave" size={16} color={COLORS.accent} />
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
                  <FontAwesome5 name="money-bill-wave" size={18} color={COLORS.primary} />
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
              
              <Text style={styles.detailSectionTitle}>Skills Needed</Text>
              <View style={styles.detailSkillContainer}>
                {(job.skills_required || "JavaScript, React, HTML, CSS, Communication, Teamwork").split(',').map((skill, idx) => (
                  <View style={styles.detailSkillBadge} key={idx}>
                    <Text style={styles.detailSkillText}>{skill.trim()}</Text>
                  </View>
                ))}
              </View>
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
                 `${job.company || job.recruiter?.company_name} is a leading company in the industry, dedicated to innovation and excellence. We pride ourselves on our commitment to quality and customer satisfaction.`}
              </Text>
              
              <View style={styles.companyStats}>
                <View style={styles.companyStatItem}>
                  <Text style={styles.companyStatValue}>500+</Text>
                  <Text style={styles.companyStatLabel}>Employees</Text>
                </View>
                <View style={styles.companyStatItem}>
                  <Text style={styles.companyStatValue}>2010</Text>
                  <Text style={styles.companyStatLabel}>Founded</Text>
                </View>
                <View style={styles.companyStatItem}>
                  <Text style={styles.companyStatValue}>20+</Text>
                  <Text style={styles.companyStatLabel}>Countries</Text>
                </View>
              </View>
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
        {/* Background Gradient - subtle pattern for candidate */}
        <LinearGradient
          colors={BACKGROUND_COLORS.default}
          style={styles.cardBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
          style={styles.cardGradient}
        />
        
        {/* Card Header */}
        <Animated.View 
          style={[
            styles.cardHeader, 
            styles.candidateHeader,
            { opacity: contentOpacity }
          ]}
        >
          {/* Candidate profile image/initial */}
          <View style={styles.candidateImageContainer}>
            <View style={styles.candidateImagePlaceholder}>
              <Text style={styles.candidateInitialText}>{candidate.first_name.charAt(0)}</Text>
            </View>
          </View>
          
          <View style={styles.headerTextContent}>
            <Text style={styles.cardTitle}>{candidate.first_name} {candidate.last_name}</Text>
            <Text style={styles.companyName}>{candidate.title}</Text>
            <View style={styles.locationWrapper}>
              <MaterialIcons name="work-outline" size={16} color="#fff" />
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
            color="#fff" 
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
              
              <Text style={styles.detailSectionTitle}>Looking For</Text>
              <Text style={styles.detailText}>
                {candidate.desired_position || "A challenging position where I can utilize my skills and experience to make a meaningful impact."}
              </Text>
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
              
              <Text style={styles.detailSectionTitle}>Soft Skills</Text>
              <View style={styles.detailSkillContainer}>
                {["Communication", "Teamwork", "Problem Solving", "Time Management", "Adaptability"].map((skill, idx) => (
                  <View style={[styles.detailSkillBadge, styles.softSkillBadge]} key={`soft-${idx}`}>
                    <Text style={styles.detailSkillText}>{skill}</Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.detailSectionTitle}>Languages</Text>
              <View style={styles.detailSkillContainer}>
                {["English (Native)", "Spanish (Intermediate)"].map((lang, idx) => (
                  <View style={[styles.detailSkillBadge, styles.languageSkillBadge]} key={`lang-${idx}`}>
                    <Text style={styles.detailSkillText}>{lang}</Text>
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
              
              <Text style={styles.detailSectionTitle}>Certifications</Text>
              <View style={styles.certContainer}>
                <View style={styles.certItem}>
                  <MaterialCommunityIcons name="certificate" size={24} color={COLORS.primary} />
                  <View style={styles.certContent}>
                    <Text style={styles.certName}>AWS Solutions Architect</Text>
                    <Text style={styles.certIssuer}>Amazon Web Services</Text>
                  </View>
                </View>
                <View style={styles.certItem}>
                  <MaterialCommunityIcons name="certificate" size={24} color={COLORS.primary} />
                  <View style={styles.certContent}>
                    <Text style={styles.certName}>Professional Scrum Master</Text>
                    <Text style={styles.certIssuer}>Scrum.org</Text>
                  </View>
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
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary]}
            style={[StyleSheet.absoluteFill, styles.loadingCardGradient]}
          />
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Finding your perfect matches...</Text>
        </View>
      );
    }
    
    if (refreshing) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentDark]}
            style={[StyleSheet.absoluteFill, styles.loadingCardGradient]}
          />
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Refreshing...</Text>
        </View>
      );
    }
    
    if (currentIndex >= data.length) {
      return (
        <View style={[styles.card, styles.endOfCards]}>
          <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Ionicons name="checkmark-circle-outline" size={96} color={COLORS.primary} />
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
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
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
              { rotate }
            ],
            height: cardHeight,
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
            opacity: nextCardOpacity,
            zIndex: 1
          }
        ]}
      >
        {userType === 'job_seeker' ? (
          <View style={styles.nextCardContent}>
            <LinearGradient
              colors={BACKGROUND_COLORS.default}
              style={styles.cardBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
              style={styles.cardGradient}
            />
            <View style={styles.nextCardHeader}>
              <Text style={styles.nextCardTitle}>{nextItem.title}</Text>
              <Text style={styles.nextCardSubtitle}>
                {nextItem.company || nextItem.recruiter?.company_name}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.nextCardContent}>
            <LinearGradient
              colors={BACKGROUND_COLORS.default}
              style={styles.cardBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
              style={styles.cardGradient}
            />
            <View style={styles.nextCardHeader}>
              <Text style={styles.nextCardTitle}>
                {nextItem.first_name} {nextItem.last_name}
              </Text>
              <Text style={styles.nextCardSubtitle}>{nextItem.title}</Text>
            </View>
          </View>
        )}
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
            style={styles.filterButton}
            onPress={() => Alert.alert('Coming Soon', 'Filters will be available in a future update.')}
          >
            <Ionicons name="options-outline" size={24} color="#333" />
          </TouchableOpacity>
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
    backgroundColor: COLORS.background,
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
    borderBottomColor: COLORS.border,
    ...SHADOWS.small
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginRight: 10,
  },
  profileButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  card: {
    position: 'absolute',
    width: width * 0.92,
    height: height * 0.68,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  cardBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 35,
    zIndex: 2,
  },
  candidateHeader: {
    paddingTop: 40,
    alignItems: 'flex-start', 
  },
  logoContainer: {
    marginRight: 15,
  },
  companyInitial: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  initialText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  candidateImageContainer: {
    marginRight: 15,
  },
  candidateImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  candidateInitialText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 6,
  },
  expandButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginLeft: 4,
  },
  cardBody: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.primary,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  salary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginLeft: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  skillBadge: {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.2)',
  },
  skillBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailedContent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    zIndex: 5,
  },
  detailTabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  activeDetailTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  detailSection: {
    flex: 1,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 16,
  },
  detailText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
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
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
  },
  detailInfoContent: {
    marginLeft: 8,
  },
  detailInfoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  detailSkillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailSkillBadge: {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.2)',
  },
  softSkillBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  languageSkillBadge: {
    backgroundColor: 'rgba(156, 39, 176, 0.08)',
    borderColor: 'rgba(156, 39, 176, 0.2)',
  },
  detailSkillText: {
    color: COLORS.text,
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
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyDetailInitialText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  companyDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  companyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    borderRadius: 16,
    padding: 15,
    marginTop: 20,
  },
  companyStatItem: {
    alignItems: 'center',
  },
  companyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  companyStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
  certContainer: {
    marginTop: 5,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  certContent: {
    marginLeft: 10,
  },
  certName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  certIssuer: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nextCard: {
    top: 10,
  },
  nextCardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nextCardHeader: {
    padding: 25,
    paddingTop: 40,
    zIndex: 2,
  },
  nextCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 6,
  },
  nextCardSubtitle: {
    fontSize: 16,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    borderTopColor: COLORS.border,
    ...SHADOWS.small
  },
  buttonWrapper: {
    // Empty wrapper for button scale animations
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    ...SHADOWS.medium,
  },
  buttonLeft: {
    backgroundColor: '#FF5252',
  },
  buttonLeftActive: {
    backgroundColor: '#D32F2F',
  },
  buttonMiddle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
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
    borderRadius: 24,
  },
  loadingCardGradient: {
    borderRadius: 24,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
    marginTop: 20,
  },
  endOfCards: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  endOfCardsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 15,
  },
  endOfCardsSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SwipeScreen;