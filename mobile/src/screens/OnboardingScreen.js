import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
  Animated,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ completeOnboarding }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Onboarding screens data
  const slides = [
    {
      id: '1',
      title: 'Welcome to SwipeHire',
      description: 'Find your perfect job match with our swipe-based job hunting app. Modern hiring for the modern workforce.',
      icon: 'briefcase-outline',
      color: COLORS.primary
    },
    {
      id: '2',
      title: 'Swipe Your Way to Success',
      description: 'Swipe right on jobs you like, left on ones you don\'t. It\'s that simple and intuitive!',
      icon: 'hand-right-outline',
      color: COLORS.accent
    },
    {
      id: '3',
      title: 'Match and Connect',
      description: 'Get matched with employers who are interested in your profile and start chatting instantly.',
      icon: 'chatbubbles-outline',
      color: COLORS.secondary
    }
  ];
  
  // Handle "Skip" button
  const handleSkip = () => {
    completeOnboarding();
  };
  
  // Handle "Next" button
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };
  
  // Render each onboarding slide
  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];
    
    const opacity = fadeAnim;
    const translateYValue = translateY;
    
    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={[item.color, lightenColor(item.color, 30)]}
          style={styles.iconBackground}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity,
                transform: [{ translateY: translateYValue }]
              }
            ]}
          >
            <Ionicons name={item.icon} size={80} color="white" />
          </Animated.View>
        </LinearGradient>
        
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity,
              transform: [{ translateY: translateYValue }]
            }
          ]}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };
  
  // Function to lighten color for gradient
  const lightenColor = (color, percent) => {
    // For simplicity, just return a lighter shade
    switch (color) {
      case COLORS.primary:
        return COLORS.primaryLight;
      case COLORS.accent:
        return COLORS.accentLight;
      case COLORS.secondary:
        return COLORS.secondaryLight;
      default:
        return color;
    }
  };
  
  // Render pagination dots
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? 
                slides[currentIndex].color : 
                'rgba(0, 0, 0, 0.2)' 
              }
            ]}
          />
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={item => item.id}
        onMomentumScrollEnd={event => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
      />
      
      {renderPagination()}
      
      <TouchableOpacity 
        style={[
          styles.button,
          { backgroundColor: slides[currentIndex].color }
        ]} 
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <Ionicons 
          name={currentIndex === slides.length - 1 ? "checkmark-circle" : "arrow-forward"} 
          size={20} 
          color="white" 
          style={styles.buttonIcon}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: height * 0.15,
  },
  iconBackground: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: SPACING.xl,
    ...SHADOWS.large,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  title: {
    fontSize: FONTS.h1,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  description: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.l,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDERS.radiusLarge,
    marginBottom: SPACING.xxl,
    alignSelf: 'center',
    ...SHADOWS.medium,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: FONTS.body,
  },
  buttonIcon: {
    marginLeft: SPACING.s,
  }
});

export default OnboardingScreen;