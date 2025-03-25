import React, { useState, useEffect, useCallback } from 'react';
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

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState('');
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  
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
      
      // Animate list fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
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
      
      return () => {
        // Reset animation when screen unfocuses
        fadeAnim.setValue(0);
      };
    }, [])
  );
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };
  
  const navigateToChat = (match) => {
    navigation.navigate('Chat', { match });
  };
  
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
  
  const getAvatarLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };
  
  const renderMatchItem = ({ item, index }) => {
    const matchName = userType === 'job_seeker' 
      ? item.job.recruiter.company_name
      : `${item.job_seeker.profile.user.first_name} ${item.job_seeker.profile.user.last_name}`;
    
    const subtitle = userType === 'job_seeker'
      ? item.job.title
      : item.job.title;
    
    const avatarLetter = userType === 'job_seeker'
      ? getAvatarLetter(item.job.recruiter.company_name)
      : getAvatarLetter(item.job_seeker.profile.user.first_name);
    
    // Calculate animation delay based on index
    const fadeInDelay = index * 100;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity 
          style={styles.matchItem} 
          onPress={() => navigateToChat(item)}
          activeOpacity={0.7}
        >
          {/* Avatar or placeholder */}
          {item.job_seeker.profile.profile_picture ? (
            <Image 
              source={{ uri: item.job_seeker.profile.profile_picture }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[
              styles.avatarPlaceholder,
              userType === 'job_seeker' ? styles.companyAvatar : styles.personAvatar
            ]}>
              <Text style={styles.avatarPlaceholderText}>{avatarLetter}</Text>
            </View>
          )}
          
          <View style={styles.matchInfo}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchName} numberOfLines={1}>{matchName}</Text>
              <Text style={styles.matchDate}>{formatDate(item.created_at)}</Text>
            </View>
            
            <Text style={styles.matchPosition} numberOfLines={1}>{subtitle}</Text>
            
            {item.last_message ? (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message}
              </Text>
            ) : (
              <View style={styles.noMessagesContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.primary} />
                <Text style={styles.noMessages}>Start the conversation</Text>
              </View>
            )}
          </View>
          
          {item.unread_count > 0 ? (
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
  };
  
  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <MaterialCommunityIcons 
        name="message-text-outline" 
        size={80} 
        color={COLORS.textLight} 
      />
      <Text style={styles.emptyTitle}>No Matches Yet</Text>
      <Text style={styles.emptyText}>
        Swipe right on {userType === 'job_seeker' ? 'jobs' : 'candidates'} you're interested in
      </Text>
      <TouchableOpacity 
        style={styles.emptyActionButton}
        onPress={() => navigation.navigate('Swipe')}
      >
        <Text style={styles.emptyActionButtonText}>Go to Swipe</Text>
      </TouchableOpacity>
    </Animated.View>
  );
  
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderTitle}>Recent Matches</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => console.log('Filter pressed')}
        >
          <Ionicons name="options-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatchItem}
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
            />
          }
          showsVerticalScrollIndicator={false}
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
    backgroundColor: 'white',
    padding: SPACING.l,
    paddingTop: Platform.OS === 'ios' ? SPACING.l : SPACING.xl + StatusBar.currentHeight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: FONTS.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BORDERS.radiusRound,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.m,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  listHeader: {
    marginBottom: SPACING.m,
    paddingBottom: SPACING.s,
  },
  listHeaderTitle: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  matchItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.small,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BORDERS.radiusRound,
    marginRight: SPACING.m,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDERS.radiusRound,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
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
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
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
    marginBottom: SPACING.s,
  },
  lastMessage: {
    fontSize: FONTS.label,
    color: COLORS.textSecondary,
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
    borderRadius: BORDERS.radiusRound,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.s,
  },
  unreadCount: {
    color: 'white',
    fontSize: FONTS.caption,
    fontWeight: 'bold',
  },
  arrowIcon: {
    marginLeft: SPACING.s,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
  },
  emptyText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.l,
  },
  emptyActionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDERS.radiusMedium,
    ...SHADOWS.small,
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
  }
});

export default MatchesScreen;