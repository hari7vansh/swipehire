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
  Pressable,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { matchingAPI } from '../services/api';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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

  // Get avatarBackground color based on first character 
  const getAvatarColor = (letter) => {
    const colors = [
      COLORS.primary, COLORS.secondary, COLORS.accent, 
      '#4E5283', '#48A9A6', '#D4B483', '#E07A5F'
    ];
    
    const charCode = letter.charCodeAt(0);
    return colors[charCode % colors.length];
  };
  
  const avatarColor = getAvatarColor(avatarLetter);
  
  return (
    <Animated.View 
      style={{ 
        opacity: fadeAnim, 
        transform: [{ 
          scale: scaleAnim 
        }] 
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
            <View style={[
              styles.avatarPlaceholder,
              { backgroundColor: avatarColor }
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

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Platform.OS === 'ios' ? 120 : 140, Platform.OS === 'ios' ? 90 : 110],
    extrapolate: 'clamp'
  });
  const headerPadding = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [20, 10],
    extrapolate: 'clamp'
  });
  
  // Animation for tab indicator
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate tab indicator
    Animated.timing(tabIndicatorAnim, {
      toValue: activeFilter === 'all' ? 0 : activeFilter === 'unread' ? 1 : 2,
      duration: 200,
      useNativeDriver: true
    }).start();
  }, [activeFilter]);
  
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
    // Vibrate for feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
    
    // Show action sheet
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
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.emptyIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons 
            name="message-text-outline" 
            size={100} 
            color="white" 
          />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No Matches Yet</Text>
        <Text style={styles.emptyText}>
          Swipe right on {userType === 'job_seeker' ? 'jobs' : 'candidates'} you're interested in to start matching!
        </Text>
        <TouchableOpacity 
          style={styles.emptyActionButton}
          onPress={() => navigation.navigate('Swipe')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.emptyActionButtonText}>Start Swiping</Text>
          <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderEmptyFilterState = () => {
    return (
      <View style={styles.emptyFilterContainer}>
        <MaterialIcons name="filter-none" size={80} color={COLORS.border} />
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
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        { 
          height: headerHeight,
        }
      ]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View style={[
          styles.headerContent,
          { paddingBottom: headerPadding }
        ]}>
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
            <Ionicons name="person-circle" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
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
              title="Pull to refresh"
              titleColor={COLORS.textSecondary}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  headerBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileButton: {
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
  emptyFilterListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  listHeader: {
    marginBottom: SPACING.m,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    padding: 6,
    marginBottom: SPACING.m,
    position: 'relative',
    ...SHADOWS.small,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeFilterTab: {
    borderRadius: BORDERS.radiusMedium - 2,
  },
  filterTabText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
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
    borderRadius: BORDERS.radiusMedium - 2,
    zIndex: 0,
  },
  filterBadge: {
    marginLeft: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDERS.radiusMedium,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
  emptyFilterContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyFilterTitle: {
    fontSize: FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  emptyFilterText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  switchFilterButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: 16,
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.2)',
  },
  switchFilterButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.label,
    fontWeight: '500',
  },
});

export default MatchesScreen;