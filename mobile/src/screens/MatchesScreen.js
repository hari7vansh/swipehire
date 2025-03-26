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
  Platform,
  Dimensions,
  Alert,
  Vibration
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { matchingAPI } from '../services/api';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Create AnimatedFlatList - this is key to solving the error
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

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
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    last_message: null,
    unread_count: 0
  }
];

// Helper function to get avatar letter
const getAvatarLetter = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

// Create a separate MatchItem component for proper hook usage
const MatchItem = React.memo(({ item, index, userType, onPress, onLongPress, delayOffset = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80 + delayOffset,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay: index * 80 + delayOffset,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, scaleAnim, index, delayOffset]);
  
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
        transform: [{ scale: scaleAnim }] 
      }}
    >
      <TouchableOpacity 
        style={[styles.matchItem, hasUnread && styles.unreadMatchItem]} 
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress && onLongPress(item)}
        activeOpacity={0.7}
        delayPressIn={50}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.job_seeker.profile.profile_picture ? (
            <Image 
              source={{ uri: item.job_seeker.profile.profile_picture }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder]}>
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

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const emptyFade = useRef(new Animated.Value(0)).current;
  
  // For header animation - use transform properties instead of height
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });
  
  useEffect(() => {
    // Animate tab indicator
    Animated.timing(tabIndicatorAnim, {
      toValue: activeFilter === 'all' ? 0 : 1,
      duration: 200,
      useNativeDriver: true
    }).start();
  }, [activeFilter]);
  
  // For empty state animation
  useEffect(() => {
    if (!loading && matches.length === 0) {
      Animated.timing(emptyFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    }
  }, [loading, matches.length, emptyFade]);
  
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

  const handleLongPress = (match) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
    
    Alert.alert(
      'Chat Options',
      null,
      [
        {
          text: 'Mark as Read',
          onPress: () => console.log('Mark as read', match.id)
        },
        {
          text: 'Archive Chat',
          style: 'destructive',
          onPress: () => console.log('Archive chat', match.id)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };
  
  // Filter matches
  const filteredMatches = matches.filter(match => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return match.unread_count > 0;
    return false;
  });
  
  const renderEmptyState = () => {
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
            size={80} 
            color={COLORS.primary} 
          />
        </View>
        <Text style={styles.emptyTitle}>No Matches Yet</Text>
        <Text style={styles.emptyText}>
          Swipe right on {userType === 'job_seeker' ? 'jobs' : 'candidates'} you're interested in to start matching!
        </Text>
        <TouchableOpacity 
          style={styles.emptyActionButton}
          onPress={() => navigation.navigate('Swipe')}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyActionButtonText}>Start Swiping</Text>
          <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderEmptyFilterState = () => {
    return (
      <View style={styles.emptyFilterContainer}>
        <MaterialIcons name="filter-none" size={60} color={COLORS.textLight} />
        <Text style={styles.emptyFilterTitle}>No unread messages</Text>
        <Text style={styles.emptyFilterText}>
          You've caught up with all your matches. Good job!
        </Text>
        <TouchableOpacity 
          style={styles.switchFilterButton}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={styles.switchFilterButtonText}>View All Messages</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]} 
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeFilterTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'unread' && styles.activeFilterTab]} 
          onPress={() => setActiveFilter('unread')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'unread' && styles.activeFilterTabText]}>
            Unread
          </Text>
          {matches.some(m => m.unread_count > 0) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {matches.reduce((sum, m) => sum + (m.unread_count > 0 ? 1 : 0), 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.tabIndicator,
            {
              transform: [{
                translateX: tabIndicatorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, width / 2 - 10]
                })
              }]
            }
          ]}
        />
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Animated Header - Using transform instead of height */}
      <Animated.View style={[
        styles.header,
        { 
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Matches</Text>
            {matches.some(m => m.unread_count > 0) && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {matches.reduce((sum, m) => sum + m.unread_count, 0)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <AnimatedFlatList // Using AnimatedFlatList instead of FlatList
          data={filteredMatches}
          renderItem={({ item, index }) => (
            <MatchItem 
              item={item} 
              index={index} 
              userType={userType}
              onPress={navigateToChat}
              onLongPress={handleLongPress}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={
            filteredMatches.length === 0 ? 
              (activeFilter === 'all' ? styles.emptyListContent : styles.emptyFilterListContent) : 
              styles.listContent
          }
          ListEmptyComponent={
            activeFilter === 'all' ? renderEmptyState() : renderEmptyFilterState()
          }
          ListHeaderComponent={filteredMatches.length > 0 ? renderHeader : null}
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
            { useNativeDriver: true } // Native driver is ok now with AnimatedFlatList
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 45 : 16,
    height: '100%',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  listContent: {
    padding: 12,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyFilterListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listHeader: {
    marginBottom: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeFilterTab: {
    borderRadius: 6,
  },
  filterTabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    borderRadius: 6,
    zIndex: 0,
  },
  filterBadge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  matchItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
    borderLeftWidth: 0,
  },
  unreadMatchItem: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  avatarPlaceholderText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  matchDate: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  matchPosition: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#666666',
  },
  unreadMessage: {
    color: '#333333',
    fontWeight: '500',
  },
  noMessagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noMessages: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyFilterContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyFilterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyFilterText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  switchFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F4F8',
  },
  switchFilterButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MatchesScreen;