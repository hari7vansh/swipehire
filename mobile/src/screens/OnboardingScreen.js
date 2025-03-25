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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ completeOnboarding }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const dotScale = useRef([
    new Animated.Value(1),
    new Animated.Value(0.5),
    new Animated.Value(0.5)
  ]).current;
  
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
    
    // Animate dot scales when index changes
    dotScale.forEach((dot, index) => {
      Animated.spring(dot, {
        toValue: currentIndex === index ? 1 : 0.5,
        friction: 4,
        useNativeDriver: true
      }).start();
    });
  }, [currentIndex]);
  
  // Onboarding screens data
  const slides = [
    {
      id: '1',
      title: 'Find Your Perfect Match',
      description: 'SwipeHire connects job seekers with great opportunities through an intuitive swipe interface. Modern hiring for the modern workforce.',
      icon: 'briefcase',
      iconComponent: Ionicons,
      color: COLORS.primary
    },
    {
      id: '2',
      title: 'Swipe Your Way to Success',
      description: 'Swipe right on jobs you\'re interested in, left on ones you\'re not. It\'s that simple and intuitive!',
      icon: 'hand-right',
      iconComponent: Ionicons,
      color: COLORS.accent
    },
    {
      id: '3',
      title: 'Chat and Connect',
      description: 'Get matched with employers who are interested in your profile and start chatting instantly. Your dream job is just a swipe away.',
      icon: 'chatbubbles',
      iconComponent: Ionicons,
      color: COLORS.secondary
    }
  ];
  
  // Handle "Skip" button
  const handleSkip = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    completeOnboarding();
  };
  
  // Handle "Next" button
  const handleNext = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      // Final slide, complete onboarding
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      completeOnboarding();
    }
  };
  
  // Render each onboarding slide
  const renderItem = ({ item, index }) => {
    const IconComponent = item.iconComponent;
    
    // Animation values for this slide
    const opacity = fadeAnim;
    const translateYValue = translateY;
    
    return (
      <View style={styles.slide}>
        {/* Large illustration icon */}
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              opacity,
              transform: [{ translateY: translateYValue }]
            }
          ]}
        >
          <LinearGradient
            colors={[item.color, lightenColor(item.color)]}
            style={styles.illustrationBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconComponent name={item.icon} size={100} color="white" />
          </LinearGradient>
        </Animated.View>
        
        {/* Content area */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity,
              transform: [{ translateY: translateYValue }]
            }
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
            <IconComponent name={item.icon} size={32} color="white" />
          </View>
          
          {/* Text content */}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };
  
  // Helper function to lighten a color
  const lightenColor = (color) => {
    // Return a lighter version of the color
    switch(color) {
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
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { 
                backgroundColor: slides[index].color,
                transform: [{ scale: dotScale[index] }]
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
      
      {/* Top header with skip button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      {/* Slides */}
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
        style={styles.flatList}
      />
      
      {/* Bottom controls - pagination dots and next button */}
      <View style={styles.controls}>
        {renderPagination()}
        
        <TouchableOpacity 
          style={[
            styles.button,
            { backgroundColor: slides[currentIndex].color }
          ]} 
          onPress={handleNext}
          activeOpacity={0.8}
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: SPACING.m,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: SPACING.s,
  },
  skipText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.l,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  illustrationBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    width: '100%',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    ...SHADOWS.medium,
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
  controls: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
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
    width: width * 0.75,
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