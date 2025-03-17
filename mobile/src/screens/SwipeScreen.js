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
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { jobsAPI, matchingAPI } from '../services/api';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

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

const SwipeScreen = () => {
  const [data, setData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        setUserType(type);
        
        // Load appropriate data based on user type
        if (type === 'job_seeker') {
          // For job seekers, show jobs
          try {
            // Try to fetch from API first
            const response = await jobsAPI.getJobs();
            if (response.data && response.data.length > 0) {
              setData(response.data);
            } else {
              // If no data from API, use sample data
              setData(SAMPLE_JOBS);
            }
          } catch (error) {
            console.log('Error fetching jobs, using sample data:', error);
            setData(SAMPLE_JOBS);
          }
        } else {
          // For recruiters, show candidates
          setData(SAMPLE_CANDIDATES);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Default to job seeker mode with sample data
        setUserType('job_seeker');
        setData(SAMPLE_JOBS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      }
    })
  ).current;
  
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };
  
  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      handleSwipe('left');
    });
  };
  
  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: width, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      handleSwipe('right');
    });
  };
  
  const handleSwipe = async (direction) => {
    if (!data || data.length === 0 || currentIndex >= data.length) {
      console.log('No data to swipe on');
      return;
    }
    
    const item = data[currentIndex];
    
    // In a real app, this would send to the server
    try {
      if (userType === 'job_seeker') {
        console.log(`Swiped ${direction} on job: ${item.title}`);
        
        if (direction === 'right') {
          // Simulate a match with 30% probability
          if (Math.random() < 0.3) {
            setTimeout(() => {
              Alert.alert(
                "It's a Match!",
                `You matched with ${item.company} for the ${item.title} position!`,
                [{ text: "Great!" }]
              );
            }, 500);
          }
        }
      } else {
        console.log(`Swiped ${direction} on candidate: ${item.first_name} ${item.last_name}`);
        
        if (direction === 'right') {
          // Simulate a match with 30% probability
          if (Math.random() < 0.3) {
            setTimeout(() => {
              Alert.alert(
                "It's a Match!",
                `You matched with ${item.first_name} ${item.last_name}!`,
                [{ text: "Great!" }]
              );
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
    
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(prevIndex => prevIndex + 1);
  };
  
  const renderJobCard = (job) => (
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{job.title}</Text>
      <Text style={styles.companyName}>{job.company || job.recruiter?.company_name}</Text>
      <Text style={styles.location}>
        <Ionicons name="location-outline" size={16} color="#666" /> {job.location}
        {job.is_remote && " • Remote"}
      </Text>
      
      <View style={styles.divider} />
      
      <Text style={styles.sectionTitle}>About the role:</Text>
      <Text style={styles.description} numberOfLines={4}>
        {job.description}
      </Text>
      
      <Text style={styles.sectionTitle}>Requirements:</Text>
      <Text style={styles.description} numberOfLines={3}>
        {job.requirements}
      </Text>
      
      {job.salary_min && job.salary_max && (
        <View style={styles.salaryContainer}>
          <Text style={styles.salary}>
            ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
          </Text>
        </View>
      )}
      
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
  );
  
  const renderCandidateCard = (candidate) => (
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{candidate.first_name} {candidate.last_name}</Text>
      <Text style={styles.companyName}>{candidate.title}</Text>
      
      <View style={styles.divider} />
      
      <Text style={styles.sectionTitle}>About:</Text>
      <Text style={styles.description} numberOfLines={3}>
        {candidate.bio}
      </Text>
      
      <Text style={styles.sectionTitle}>Skills:</Text>
      <Text style={styles.description} numberOfLines={2}>
        {candidate.skills}
      </Text>
      
      <Text style={styles.sectionTitle}>Experience & Education:</Text>
      <Text style={styles.description}>
        {candidate.experience_years} years of experience
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {candidate.education}
      </Text>
    </View>
  );
  
  const renderCard = () => {
    if (loading) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Loading...</Text>
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
            onPress={() => setCurrentIndex(0)}
          >
            <Text style={styles.refreshButtonText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    const item = data[currentIndex];
    
    return (
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotation }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        {userType === 'job_seeker' ? renderJobCard(item) : renderCandidateCard(item)}
        
        <View style={styles.swipeIndicatorContainer}>
          <Animated.View
            style={[
              styles.swipeIndicator, 
              styles.likeIndicator,
              {
                opacity: position.x.interpolate({
                  inputRange: [0, width * 0.2],
                  outputRange: [0, 1],
                  extrapolate: 'clamp'
                })
              }
            ]}
          >
            <Ionicons name="checkmark" size={32} color="white" />
            <Text style={styles.indicatorText}>LIKE</Text>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.swipeIndicator, 
              styles.nopeIndicator,
              {
                opacity: position.x.interpolate({
                  inputRange: [-width * 0.2, 0],
                  outputRange: [1, 0],
                  extrapolate: 'clamp'
                })
              }
            ]}
          >
            <Ionicons name="close" size={32} color="white" />
            <Text style={styles.indicatorText}>NOPE</Text>
          </Animated.View>
        </View>
      </Animated.View>
    );
  };
  
  const renderNextCard = () => {
    if (currentIndex >= data.length - 1 || loading) {
      return null;
    }
    
    const item = data[currentIndex + 1];
    
    return (
      <View style={[styles.card, styles.nextCard]}>
        {userType === 'job_seeker' ? (
          <>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.companyName}>{item.company || item.recruiter?.company_name}</Text>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>{item.first_name} {item.last_name}</Text>
            <Text style={styles.companyName}>{item.title}</Text>
          </>
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderNextCard()}
      {renderCard()}
      
      {!loading && currentIndex < data.length && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={swipeLeft}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonRight]} onPress={swipeRight}>
            <Ionicons name="checkmark" size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: 'white',
    borderRadius: 20,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    flex: 1,
  },
  nextCard: {
    top: 10,
    padding: 20,
    opacity: 0.7,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  companyName: {
    fontSize: 18,
    color: '#555',
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    color: '#777',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    color: '#444',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  salaryContainer: {
    marginTop: 10,
  },
  salary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: 'rgba(76, 175, 80, 0.7)',
    right: 20,
  },
  nopeIndicator: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.7)',
    left: 20,
  },
  indicatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SwipeScreen;