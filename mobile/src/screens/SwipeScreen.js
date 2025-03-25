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
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { matchingAPI, jobsAPI } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

// Sample data for jobs and candidates - SAME AS BEFORE, KEEP YOUR EXISTING SAMPLE DATA

const SwipeScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Simple state for positioning and animation
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cardRotation, setCardRotation] = useState('0deg');
  const [likeOpacity, setLikeOpacity] = useState(0);
  const [nopeOpacity, setNopeOpacity] = useState(0);
  
  // Ref to track animation in progress
  const animationInProgress = useRef(false);
  
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
  
  // Simple pan responder without animations
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
      },
      onPanResponderMove: (_, gesture) => {
        // Don't update if animation is in progress
        if (animationInProgress.current) return;
        
        // Limit vertical drag
        const y = Math.abs(gesture.dy) > 100 ? (gesture.dy > 0 ? 100 : -100) : gesture.dy;
        setPosition({ x: gesture.dx, y: y * 0.5 });
        
        // Update rotation based on horizontal position
        const rotation = (gesture.dx / width) * 10;
        setCardRotation(`${rotation}deg`);
        
        // Update like/nope indicators
        if (gesture.dx > 0) {
          setLikeOpacity(Math.min(1, gesture.dx / (width * 0.15)));
          setNopeOpacity(0);
        } else if (gesture.dx < 0) {
          setNopeOpacity(Math.min(1, Math.abs(gesture.dx) / (width * 0.15)));
          setLikeOpacity(0);
        } else {
          setLikeOpacity(0);
          setNopeOpacity(0);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;
  
  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setCardRotation('0deg');
    setLikeOpacity(0);
    setNopeOpacity(0);
  };
  
  const forceSwipe = (direction) => {
    // Set animation in progress flag
    animationInProgress.current = true;
    
    // Trigger haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
    
    // Set final position immediately (no animation)
    const x = direction === 'right' ? width * 1.5 : -width * 1.5;
    setPosition({ x, y: 0 });
    
    // Delay to allow the UI to update before resetting
    setTimeout(() => {
      handleSwipe(direction);
    }, 300);
  };
  
  const handleSwipe = async (direction) => {
    // If we've run out of cards, don't process the swipe
    if (!data || data.length === 0 || currentIndex >= data.length) {
      animationInProgress.current = false;
      return;
    }
    
    const item = data[currentIndex];
    
    try {
      // Call the API to record swipe
      if (userType === 'job_seeker') {
        await matchingAPI.swipe({
          direction,
          job_id: item.id
        });
        
        // If it's a right swipe, check for a match
        if (direction === 'right') {
          // In a real app, the match response would come from the API
          // For now, we're simulating a 30% match rate
          if (Math.random() < 0.3) {
            setTimeout(() => {
              showMatchAlert(item);
            }, 500);
          }
        }
      } else {
        // For recruiters
        await matchingAPI.swipe({
          direction,
          job_seeker_id: item.id,
          job_id: 1 // Would need to be dynamically set in a real app
        });
        
        if (direction === 'right' && Math.random() < 0.3) {
          setTimeout(() => {
            showMatchAlert(item);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
    
    // Reset position and move to next card
    resetPosition();
    setCurrentIndex(prevIndex => prevIndex + 1);
    
    // Clear animation in progress flag
    animationInProgress.current = false;
  };
  
  const showMatchAlert = (item) => {
    // Play haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate([0, 80, 100, 80]);
    }
    
    // Show match alert differently based on user type
    if (userType === 'job_seeker') {
      Alert.alert(
        "It's a Match! 🎉",
        `Congratulations! You matched with ${item.company || item.recruiter?.company_name} for the ${item.title} position.`,
        [
          { 
            text: "View Matches", 
            onPress: () => navigation.navigate('Matches'),
            style: "default" 
          },
          { text: "Keep Swiping", style: "cancel" }
        ]
      );
    } else {
      Alert.alert(
        "It's a Match! 🎉",
        `Congratulations! You matched with ${item.first_name} ${item.last_name} for your job position.`,
        [
          { 
            text: "View Matches", 
            onPress: () => navigation.navigate('Matches'),
            style: "default" 
          },
          { text: "Keep Swiping", style: "cancel" }
        ]
      );
    }
  };
  
  const refreshCards = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setCurrentIndex(0);
      setRefreshing(false);
    }, 1000);
  };
  
  const renderJobCard = (job) => (
    <View style={styles.cardContent}>
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{job.title}</Text>
        <Text style={styles.companyName}>{job.company || job.recruiter?.company_name}</Text>
        <View style={styles.locationWrapper}>
          <Ionicons name="location-outline" size={16} color="#fff" />
          <Text style={styles.location}>{job.location}
            {job.is_remote && " • Remote"}
          </Text>
        </View>
      </View>
      
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
  
  const renderCandidateCard = (candidate) => (
    <View style={styles.cardContent}>
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{candidate.first_name} {candidate.last_name}</Text>
        <Text style={styles.companyName}>{candidate.title}</Text>
      </View>
      
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
          <Text style={styles.sectionTitle}>Experience & Education:</Text>
          <Text style={styles.description}>
            {candidate.experience_years} years of experience
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {candidate.education}
          </Text>
        </View>
      </View>
    </View>
  );
  
  const renderCard = () => {
    if (loading) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.endOfCardsText}>No more cards</Text>
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
      <View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            left: position.x,
            top: position.y,
            transform: [{ rotate: cardRotation }]
          }
        ]}
      >
        {userType === 'job_seeker' ? renderJobCard(item) : renderCandidateCard(item)}
        
        <View style={styles.swipeIndicatorContainer}>
          <View
            style={[
              styles.swipeIndicator, 
              styles.likeIndicator,
              { opacity: likeOpacity }
            ]}
          >
            <Ionicons name="checkmark" size={32} color="white" />
            <Text style={styles.indicatorText}>LIKE</Text>
          </View>
          
          <View
            style={[
              styles.swipeIndicator, 
              styles.nopeIndicator,
              { opacity: nopeOpacity }
            ]}
          >
            <Ionicons name="close" size={32} color="white" />
            <Text style={styles.indicatorText}>NOPE</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderNextCard = () => {
    if (currentIndex >= data.length - 1 || loading || refreshing) {
      return null;
    }
    
    const nextItem = data[currentIndex + 1];
    
    return (
      <View style={[styles.card, styles.nextCard]}>
        {userType === 'job_seeker' ? (
          <View style={styles.nextCardContent}>
            <Text style={styles.nextCardTitle}>{nextItem.title}</Text>
            <Text style={styles.nextCardSubtitle}>
              {nextItem.company || nextItem.recruiter?.company_name}
            </Text>
          </View>
        ) : (
          <View style={styles.nextCardContent}>
            <Text style={styles.nextCardTitle}>{nextItem.first_name} {nextItem.last_name}</Text>
            <Text style={styles.nextCardSubtitle}>{nextItem.title}</Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
      
      <View style={styles.cardContainer}>
        {renderNextCard()}
        {renderCard()}
      </View>
      
      {!loading && !refreshing && currentIndex < data.length && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonLeft]} 
            onPress={() => forceSwipe('left')}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.buttonMiddle]} 
            onPress={refreshCards}
          >
            <Ionicons name="refresh" size={26} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.buttonRight]} 
            onPress={() => forceSwipe('right')}
          >
            <Ionicons name="checkmark" size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// SAMPLE_JOBS and SAMPLE_CANDIDATES arrays should be defined here (from your original code)
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
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: 'white',
    borderRadius: 20,
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    padding: 20,
    paddingTop: 30,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 5,
  },
  companyName: {
    fontSize: 18,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 5,
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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#444',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
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
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  nextCard: {
    top: 10,
    padding: 20,
    opacity: 0.7,
    transform: [{ scale: 0.95 }]
  },
  nextCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  nextCardSubtitle: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
  },
  swipeIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  swipeIndicator: {
    position: 'absolute',
    padding: 10,
    borderWidth: 3,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  likeIndicator: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    right: 50,
    top: 50,
  },
  nopeIndicator: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.8)',
    left: 50,
    top: 50,
  },
  indicatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonLeft: {
    backgroundColor: '#FF5252',
  },
  buttonMiddle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFC107',
  },
  buttonRight: {
    backgroundColor: '#4CAF50',
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#888',
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
    color: '#555',
    marginVertical: 15,
  },
  endOfCardsSubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SwipeScreen;