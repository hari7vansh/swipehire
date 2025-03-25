import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar, 
  RefreshControl,
  Animated,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { matchingAPI } from '../services/api';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

// Sample matches data
const SAMPLE_MATCHES = [
  {
    id: 101,
    job: {
      id: 1,
      title: "Frontend Developer",
      recruiter: {
        company_name: "Tech Innovations Inc.",
      },
    },
    job_seeker: {
      profile: {
        user: {
          first_name: "Alex",
          last_name: "Johnson",
        },
        profile_picture: null
      }
    },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    last_message: "Hi Alex, I'd like to schedule an interview. Are you available next week?",
    unread_count: 1
  },
  {
    id: 102,
    job: {
      id: 3,
      title: "Mobile Developer",
      recruiter: {
        company_name: "AppWorks Studios",
      },
    },
    job_seeker: {
      profile: {
        user: {
          first_name: "Sarah",
          last_name: "Williams",
        },
        profile_picture: null
      }
    },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    last_message: "Thanks for your application. Your skills are impressive!",
    unread_count: 0
  },
  {
    id: 103,
    job: {
      id: 4,
      title: "UX/UI Designer",
      recruiter: {
        company_name: "Creative Solutions",
      },
    },
    job_seeker: {
      profile: {
        user: {
          first_name: "Michael",
          last_name: "Chen",
        },
        profile_picture: null
      }
    },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    last_message: null, // No messages yet
    unread_count: 0
  }
];

// Create a separate MatchItem component for proper hook usage
const MatchItem = React.memo(({ item, index, userType, onPress, delayOffset = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const isJobSeeker = userType === 'job_seeker';
  const matchName = isJobSeeker
    ? item.job.recruiter.company_name
    : `${item.job_seeker.profile.user.first_name} ${item.job_seeker.profile.user.last_name}`;
  
  const subtitle = item.job.title;
  
  const avatarLetter = isJobSeeker
    ? getAvatarLetter(item.job.recruiter.company_name)
    : getAvatarLetter(item.job_seeker.profile.user.first_name);
  
  const hasUnread = item.unread_count > 0;
  
  // Animation effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100 + delayOffset,
      useNativeDriver: true
    }).start();
  }, [fadeAnim, index, delayOffset]);
  
  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Check if it's this week
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Otherwise, return formatted date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <Animated.View 
      style={{ 
        opacity: fadeAnim, 
        transform: [{ 
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          }) 
        }] 
      }}
    >
      <TouchableOpacity 
        style={[styles.matchItem, hasUnread && styles.unreadMatchItem]} 
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.job_seeker.profile.profile_picture ? (
            <Image 
              source={{ uri: item.job_seeker.profile.profile_picture }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[
              styles.avatarPlaceholder,
              isJobSeeker ? styles.companyAvatar : styles.personAvatar
            ]}>
              <Text style={styles.avatarPlaceholderText}>{avatarLetter}</Text>
            </View>
          )}
          {hasUnread && <View style={styles.badge} />}
        </View>
        
        {/* Match Info */}
        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchName} numberOfLines={1}>{matchName}</Text>
            <Text style={styles.matchDate}>{formatDate(item.created_at)}</Text>
          </View>
          
          <Text style={styles.matchPosition} numberOfLines={1}>{subtitle}</Text>
          
          {item.last_message ? (
            <Text 
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]} 
              numberOfLines={1}
            >
              {item.last_message}
            </Text>
          ) : (
            <View style={styles.noMessagesContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.primary} />
              <Text style={styles.noMessages}>Start the conversation</Text>
            </View>
          )}
        </View>
        
        {hasUnread ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={COLORS.textLight} 
            style={styles.arrowIcon} 
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// Helper function to get avatar letter
const getAvatarLetter = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState('');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Platform.OS === 'ios' ? 120 : 140, Platform.OS === 'ios' ? 90 : 110],
    extrapolate: 'clamp'
  });
  const headerTitleSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [32, 24],
    extrapolate: 'clamp'
  });
  const headerPadding = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [20, 10],
    extrapolate: 'clamp'
  });
  
  const fetchMatches = async () => {
    try {
      const type = await AsyncStorage.getItem('userType');
      setUserType(type);
      
      // In a real app, fetch matches from API
      // For now use sample data
      const response = await matchingAPI.getMatches();
      
      // If API fails, use sample data
      if (response?.data) {
        setMatches(response.data);
      } else {
        setMatches(SAMPLE_MATCHES);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches(SAMPLE_MATCHES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch matches when screen focuses
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMatches();
    }, [])
  );
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };
  
  const navigateToChat = (match) => {
    navigation.navigate('Chat', { match });
  };
  
  const renderEmptyState = () => {
    const emptyFade = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(emptyFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    }, [emptyFade]);
    
    return (
      <Animated.View 
        style={[
          styles.emptyContainer,
          { opacity: emptyFade }
        ]}
      >
        <View style={styles.emptyIconContainer}>
          <MaterialCommunityIcons 
            name="message-text-outline" 
            size={100} 
            color="white" 
          />
        </View>
        <Text style={styles.emptyTitle}>No Matches Yet</Text>
        <Text style={styles.emptyText}>
          Swipe right on {userType === 'job_seeker' ? 'jobs' : 'candidates'} you're interested in to start matching!
        </Text>
        <TouchableOpacity 
          style={styles.emptyActionButton}
          onPress={() => navigation.navigate('Swipe')}
        >
          <Text style={styles.emptyActionButtonText}>Go to Swipe</Text>
          <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderTitle}>Your Matches</Text>
      <View style={styles.listHeaderDivider} />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        { 
          height: headerHeight,
          opacity: headerOpacity
        }
      ]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[
          styles.headerContent,
          { paddingBottom: headerPadding }
        ]}>
          <Animated.Text style={[
            styles.headerTitle,
            { fontSize: headerTitleSize }
          ]}>
            Matches
          </Animated.Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={22} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={({ item, index }) => (
            <MatchItem 
              item={item} 
              index={index} 
              userType={userType}
              onPress={navigateToChat}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={matches.length === 0 ? styles.emptyListContent : styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListHeaderComponent={matches.length > 0 ? renderHeader : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
              progressBackgroundColor="white"
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
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
    overflow: 'hidden',
    zIndex: 10,
    ...SHADOWS.medium
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontWeight: 'bold',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.m,
    paddingTop: SPACING.l,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  listHeader: {
    marginBottom: SPACING.m,
  },
  listHeaderTitle: {
    fontSize: FONTS.h3,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  listHeaderDivider: {
    height: 2,
    width: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  matchItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.small,
    alignItems: 'center',
    borderLeftWidth: 0,
  },
  unreadMatchItem: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.m,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyAvatar: {
    backgroundColor: COLORS.primary,
  },
  personAvatar: {
    backgroundColor: COLORS.secondary,
  },
  avatarPlaceholderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: 'white',
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: FONTS.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  matchDate: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.s,
  },
  matchPosition: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  lastMessage: {
    fontSize: FONTS.label,
    color: COLORS.textSecondary,
  },
  unreadMessage: {
    color: COLORS.text,
    fontWeight: '500',
  },
  noMessagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noMessages: {
    fontSize: FONTS.label,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginLeft: 5,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.s,
  },
  unreadCount: {
    color: 'white',
    fontSize: FONTS.small,
    fontWeight: 'bold',
  },
  arrowIcon: {
    marginLeft: SPACING.s,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  emptyTitle: {
    fontSize: FONTS.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  emptyActionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDERS.radiusMedium,
    ...SHADOWS.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
  }
});

export default MatchesScreen;