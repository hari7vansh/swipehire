import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Animated,
  StatusBar,
  Keyboard,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { matchingAPI } from '../services/api';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Sample messages for the chat
const SAMPLE_MESSAGES = [
  {
    id: 1,
    sender_id: 999, // This will be compared with the current user to determine message alignment
    content: "Hello! I'm interested in the position you applied for.",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
  },
  {
    id: 2,
    sender_id: 998, // This will be set to the current user's ID
    content: "Hi! Thanks for reaching out. I'm very excited about the opportunity.",
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString() // 50 min ago
  },
  {
    id: 3,
    sender_id: 999,
    content: "Your experience looks great. When would you be available for an interview?",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 min ago
  },
  {
    id: 4,
    sender_id: 998,
    content: "I'm available next week on Tuesday and Thursday afternoon. Would either of those work for you?",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
  },
  {
    id: 5,
    sender_id: 999,
    content: "Tuesday at 2 PM works perfectly. I'll send a calendar invite with the details.",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 min ago
  }
];

const ChatScreen = ({ route, navigation }) => {
  const { match } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState(998); // Default user ID for sample data
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  // Refs
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const messageAnimation = useRef({}).current;
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Hide header when keyboard appears
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Show header when keyboard hides
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        const userIdFromStorage = await AsyncStorage.getItem('userId');
        
        setUserType(type);
        if (userIdFromStorage) {
          setUserId(parseInt(userIdFromStorage));
        }
        
        // Set chat partner info based on user type
        if (type === 'job_seeker') {
          setChatPartner({
            name: match.job.recruiter.company_name,
            subtitle: match.job.title,
            avatarLetter: match.job.recruiter.company_name.charAt(0)
          });
        } else {
          const firstName = match.job_seeker.profile.user.first_name;
          const lastName = match.job_seeker.profile.user.last_name;
          setChatPartner({
            name: `${firstName} ${lastName}`,
            subtitle: match.job.title,
            avatarLetter: firstName.charAt(0)
          });
        }
        
        // In a real app, fetch messages from API
        try {
          const response = await matchingAPI.getMessages(match.id);
          if (response?.data) {
            setMessages(response.data);
          } else {
            setMessages(SAMPLE_MESSAGES);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          setMessages(SAMPLE_MESSAGES);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setMessages(SAMPLE_MESSAGES);
      } finally {
        setLoading(false);
        
        // Scroll to bottom after a short delay
        setTimeout(() => {
          scrollToBottom(false);
        }, 300);
      }
    };
    
    fetchData();
  }, [match]);
  
  const scrollToBottom = (animated = true) => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated });
    }
  };
  
  const sendMessage = async () => {
    if (!inputText.trim() || sendingMessage) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSendingMessage(true);
    
    // Clear input immediately for better UX
    const messageText = inputText.trim();
    setInputText('');
    
    // Create temporary message object
    const tempId = Date.now();
    const newMessage = {
      id: tempId,
      sender_id: userId,
      content: messageText,
      created_at: new Date().toISOString(),
      pending: true
    };
    
    // Add to state
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Ensure keyboard doesn't interfere with scrolling
    Keyboard.dismiss();
    
    // Scroll to bottom after new message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    try {
      // Send message to API
      const response = await matchingAPI.sendMessage({
        match_id: match.id,
        content: messageText
      });
      
      // Update message status
      if (response?.data) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId ? { ...response.data, pending: false } : msg
          )
        );
      } else {
        // If API didn't return data, just remove pending state
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId ? { ...msg, pending: false } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error state for the message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId ? { ...msg, pending: false, error: true } : msg
        )
      );
    } finally {
      setSendingMessage(false);
    }
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatMessageDate = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  const shouldShowDate = (message, index) => {
    if (index === 0) return true;
    
    const currentDate = formatMessageDate(message.created_at);
    const prevDate = formatMessageDate(messages[index - 1].created_at);
    
    return currentDate !== prevDate;
  };
  
  const shouldShowAvatar = (message, index) => {
    // Show avatar for other user's messages
    const isOwnMessage = message.sender_id === userId;
    if (isOwnMessage) return false;
    
    // If it's the last message or the next message is from a different sender, show avatar
    if (index === messages.length - 1) return true;
    const nextMessage = messages[index + 1];
    return nextMessage.sender_id !== message.sender_id;
  };
  
  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === userId;
    const showDate = shouldShowDate(item, index);
    const showAvatar = shouldShowAvatar(item, index);
    
    // Create animation if it doesn't exist
    if (!messageAnimation[item.id]) {
      // Use different initial values for existing vs new messages
      const isNewMessage = index >= messages.length - 1 && item.pending;
      messageAnimation[item.id] = {
        opacity: new Animated.Value(isNewMessage ? 0 : 1),
        translateY: new Animated.Value(isNewMessage ? 20 : 0)
      };
      
      // Animate new messages
      if (isNewMessage) {
        Animated.parallel([
          Animated.timing(messageAnimation[item.id].opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(messageAnimation[item.id].translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ]).start();
      }
    }
    
    return (
      <View>
        {showDate && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeader}>{formatMessageDate(item.created_at)}</Text>
          </View>
        )}
        
        <Animated.View 
          style={[
            styles.messageRow,
            isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
            {
              opacity: messageAnimation[item.id]?.opacity || 1,
              transform: [{ translateY: messageAnimation[item.id]?.translateY || 0 }]
            }
          ]}
        >
          {!isOwnMessage && showAvatar ? (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {chatPartner?.avatarLetter || '?'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.avatarSpacer} />
          )}
          
          <View 
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
              item.pending && styles.pendingMessage,
              item.error && styles.errorMessage
            ]}
          >
            <Text 
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}
            >
              {item.content}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text 
                style={[
                  styles.messageTime,
                  isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                ]}
              >
                {formatTime(item.created_at)}
              </Text>
              
              {item.pending && (
                <Ionicons 
                  name="time-outline" 
                  size={12} 
                  color={isOwnMessage ? "rgba(255,255,255,0.6)" : COLORS.textLight} 
                  style={styles.messageIcon} 
                />
              )}
              
              {item.error && (
                <Ionicons 
                  name="alert-circle" 
                  size={12} 
                  color={COLORS.error} 
                  style={styles.messageIcon} 
                />
              )}
              
              {!item.pending && !item.error && isOwnMessage && (
                <Ionicons 
                  name="checkmark-done" 
                  size={12} 
                  color="rgba(255,255,255,0.6)" 
                  style={styles.messageIcon} 
                />
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };
  
  const renderChatHeader = () => {
    return (
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: headerOpacity,
            transform: [
              { 
                translateY: headerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 0]
                })
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          {chatPartner && (
            <TouchableOpacity 
              style={styles.chatPartnerInfo} 
              onPress={() => {
                // Show job or profile details in future enhancement
                Alert.alert('View Details', 'View complete details feature coming soon!');
              }}
            >
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{chatPartner.avatarLetter}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName} numberOfLines={1}>{chatPartner.name}</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>{chatPartner.subtitle}</Text>
              </View>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => {
              // Show chat options in future enhancement
              Alert.alert('Chat Options', 'More chat options coming soon!');
            }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    );
  };
  
  const renderJobInfo = () => {
    return (
      <View style={styles.jobInfoCard}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={[StyleSheet.absoluteFill, styles.jobCardGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.jobCardContent}>
          <Text style={styles.jobCardTitle}>{match.job.title}</Text>
          <Text style={styles.jobCardCompany}>
            {match.job.recruiter.company_name}
          </Text>
          <View style={styles.jobCardFooter}>
            <Text style={styles.jobCardMatch}>It's a match!</Text>
            <Text style={styles.jobCardDate}>
              Matched on {new Date(match.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      {renderChatHeader()}
      
      {/* Chat Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          ListHeaderComponent={renderJobInfo}
          ListHeaderComponentStyle={styles.listHeader}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
        
        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              multiline
              placeholderTextColor={COLORS.placeholder}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() ? styles.sendButtonDisabled : {},
                sendingMessage && styles.sendingButton
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sendingMessage}
              activeOpacity={0.7}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={!inputText.trim() ? COLORS.textLight : 'white'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  header: {
    height: Platform.OS === 'ios' ? 100 : 80,
    backgroundColor: COLORS.primary,
    position: 'relative',
    zIndex: 10,
    ...SHADOWS.medium
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatPartnerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listHeader: {
    marginBottom: 16,
  },
  jobInfoCard: {
    margin: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 120,
    ...SHADOWS.medium,
  },
  jobCardGradient: {
    borderRadius: 16,
  },
  jobCardContent: {
    padding: 16,
    height: '100%',
    justifyContent: 'center',
  },
  jobCardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  jobCardCompany: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    marginBottom: 12,
  },
  jobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobCardMatch: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jobCardDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  messagesList: {
    paddingBottom: 10,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeader: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarSpacer: {
    width: 44,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  pendingMessage: {
    opacity: 0.7,
  },
  errorMessage: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: COLORS.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  otherMessageTime: {
    color: COLORS.textLight,
  },
  messageIcon: {
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 8,
    ...SHADOWS.small,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendingButton: {
    backgroundColor: COLORS.primaryLight,
  }
});

export default ChatScreen;