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
  Image,
  Vibration,
  StatusBar,
  SafeAreaView,
  Platform,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { matchingAPI, jobsAPI } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const ROTATION_ANGLE = 15; // Degrees to rotate when swiping
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

const SwipeScreen = ({ navigation }) => {
  // State
  const [data, setData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

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
      onStartShouldSetPanResponder: () => !swipeInProgress.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !swipeInProgress.current && 
               (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10);
      },
      onPanResponderGrant: () => {
        position.setOffset({
          x: position.x._value,
          y: position.y._value
        });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit vertical movement and prioritize horizontal
        const dx = gestureState.dx;
        const dy = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 
          ? gestureState.dy * 0.2 // When primarily horizontal, dampen vertical
          : gestureState.dy * 0.5; // Otherwise just dampen slightly
        
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
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  // Swipe card with animation
  const swipeCard = (direction) => {
    if (swipeInProgress.current) return;
    swipeInProgress.current = true;
    
    // Trigger haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
    
    // Set swipe direction for UI
    setSwipeDirection(direction);
    
    // Calculate swipe destination
    const xDestination = direction === 'right' ? width * 1.5 : -width * 1.5;
    
    // Animate swipe
    Animated.timing(position, {
      toValue: { x: xDestination, y: 0 },
      duration: 300,
      useNativeDriver: true,
      easing: Easing.ease
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

  // Manual swipe buttons
  const handleButtonSwipe = (direction) => {
    if (currentIndex >= data.length || loading || refreshing || swipeInProgress.current) return;
    swipeCard(direction);
  };

  /* Render Functions */

  // Render job card
  const renderJobCard = (job) => (
    <View style={styles.cardContent}>
      {/* Card Header with Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardHeader}>
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
      
      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the role:</Text>
          <Text style={styles.description} numberOfLines={4}>
            {job.description}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements:</Text>
          <Text style={styles.description} numberOfLines={3}>
            {job.requirements}
          </Text>
        </View>
        
        {job.salary_min && job.salary_max && (
          <View style={styles.salaryContainer}>
            <FontAwesome5 name="money-bill-wave" size={16} color="#4CAF50" />
            <Text style={styles.salary}>
              ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
            </Text>
          </View>
        )}
      </View>
      
      {/* Card Footer */}
      <View style={styles.cardFooter}>
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
      </View>
    </View>
  );
  
  // Render candidate card
  const renderCandidateCard = (candidate) => (
    <View style={styles.cardContent}>
      {/* Card Header with Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{candidate.first_name} {candidate.last_name}</Text>
        <Text style={styles.companyName}>{candidate.title}</Text>
        <View style={styles.locationWrapper}>
          <MaterialIcons name="work-outline" size={16} color="#fff" />
          <Text style={styles.location}>
            {candidate.experience_years} years experience
          </Text>
        </View>
      </View>
      
      {/* Card Body */}
      <View style={styles.cardBody}>
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
      </View>
    </View>
  );
  
  // Render card
  const renderCard = () => {
    if (loading) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profiles...</Text>
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
          <Ionicons name="checkmark-circle-outline" size={80} color="#bbb" />
          <Text style={styles.endOfCardsText}>No more profiles</Text>
          <Text style={styles.endOfCardsSubtext}>
            Check back later for more {userType === 'job_seeker' ? 'jobs' : 'candidates'}
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshCards}
          >
            <Text style={styles.refreshButtonText}>Start Over</Text>
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
          <Ionicons name="checkmark" size={36} color="white" />
          <Text style={styles.indicatorText}>LIKE</Text>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.swipeIndicator, 
            styles.nopeIndicator,
            { opacity: nopeOpacity }
          ]}
        >
          <Ionicons name="close" size={36} color="white" />
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
          <View style={styles.cardContent}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
              style={styles.cardGradient}
            />
            
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{nextItem.title}</Text>
              <Text style={styles.companyName}>
                {nextItem.company || nextItem.recruiter?.company_name}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardContent}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
              style={styles.cardGradient}
            />
            
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {nextItem.first_name} {nextItem.last_name}
              </Text>
              <Text style={styles.companyName}>{nextItem.title}</Text>
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
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => Alert.alert('Coming Soon', 'Filters will be available in a future update.')}
        >
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Cards */}
      <View style={styles.cardContainer}>
        {renderNextCard()}
        {renderCard()}
      </View>
      
      {/* Swipe Buttons */}
      {!loading && !refreshing && currentIndex < data.length && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonLeft, swipeDirection === 'left' && styles.buttonLeftActive]} 
            onPress={() => handleButtonSwipe('left')}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.buttonMiddle]} 
            onPress={refreshCards}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={26} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.buttonRight, swipeDirection === 'right' && styles.buttonRightActive]} 
            onPress={() => handleButtonSwipe('right')}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={30} color="white" />
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  card: {
    position: 'absolute',
    width: width * 0.9,
    height: height * 0.68,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 20,
    paddingTop: 35,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 20,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 16,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginLeft: 5,
  },
  cardBody: {
    flex: 1,
    padding: 20,
    paddingTop: 15,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
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
    borderRadius: 10,
    marginTop: 15,
  },
  salary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
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
  skillBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  nextCard: {
    top: 10,
  },
  swipeIndicator: {
    position: 'absolute',
    padding: 10,
    borderWidth: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  likeIndicator: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    right: 30,
    top: 40,
  },
  nopeIndicator: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.8)',
    left: 30,
    top: 40,
  },
  indicatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 25,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    ...SHADOWS.medium,
  },
  buttonLeft: {
    backgroundColor: '#FF5252',
  },
  buttonLeftActive: {
    backgroundColor: '#D32F2F',
    transform: [{ scale: 1.1 }],
  },
  buttonMiddle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFC107',
  },
  buttonRight: {
    backgroundColor: '#4CAF50',
  },
  buttonRightActive: {
    backgroundColor: '#388E3C',
    transform: [{ scale: 1.1 }],
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  endOfCards: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endOfCardsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 15,
  },
  endOfCardsSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    ...SHADOWS.small,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SwipeScreen;