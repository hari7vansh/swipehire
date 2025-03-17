import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [userType, setUserType] = useState('');
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        setUserType(type);
        
        // In a real app, fetch matches from API
        // Here we'll simulate a delay and use sample data
        setTimeout(() => {
          setMatches(SAMPLE_MATCHES);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
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
    
    // Otherwise, return formatted date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const renderMatchItem = ({ item }) => {
    const matchName = userType === 'job_seeker' 
      ? item.job.recruiter.company_name
      : `${item.job_seeker.profile.user.first_name} ${item.job_seeker.profile.user.last_name}`;
    
    const subtitle = userType === 'job_seeker'
      ? item.job.title
      : item.job.title;
    
    const avatarPlaceholder = userType === 'job_seeker'
      ? item.job.recruiter.company_name.charAt(0)
      : item.job_seeker.profile.user.first_name.charAt(0);
    
    return (
      <TouchableOpacity 
        style={styles.matchItem} 
        onPress={() => navigateToChat(item)}
      >
        {/* Avatar or placeholder */}
        {item.job_seeker.profile.profile_picture ? (
          <Image 
            source={{ uri: item.job_seeker.profile.profile_picture }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>{avatarPlaceholder}</Text>
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
            <Text style={styles.noMessages}>Start the conversation</Text>
          )}
        </View>
        
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>No Matches Yet</Text>
      <Text style={styles.emptyText}>
        Swipe right on {userType === 'job_seeker' ? 'jobs' : 'candidates'} you're interested in
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={matches.length === 0 ? styles.emptyListContent : styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 15,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  matchItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  matchPosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#777',
  },
  noMessages: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#ff6b6b',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});

export default MatchesScreen;