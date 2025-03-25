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
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { matchingAPI } from '../services/api';
import { COLORS, FONTS, SPACING, BORDERS, SHADOWS } from '../theme';

// Sample messages for the chat (same as original)
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
  
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputHeight = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        const userIdFromStorage = await AsyncStorage.getItem('userId');
        
        setUserType(type);
        if (userIdFromStorage) {
          setUserId(parseInt(userIdFromStorage));
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
        
        // Animate fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Set the chat title and configure header
        const chatName = userType === 'job_seeker' 
          ? match.job.recruiter.company_name
          : `${match.job_seeker.profile.user.first_name} ${match.job_seeker.profile.user.last_name}`;
          
        navigation.setOptions({
          title: chatName,
          headerStyle: {
            backgroundColor: COLORS.card,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          },
          headerTitleStyle: {
            fontSize: FONTS.h3,
            color: COLORS.text,
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              style={{ marginLeft: 10 }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 15 }}
              onPress={() => console.log('Info pressed')}
            >
              <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        });
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setMessages(SAMPLE_MESSAGES);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigation, match]);
  
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    setSendingMessage(true);
    
    // Optimistically add the message to the UI immediately
    const tempId = Date.now();
    const newMessage = {
      id: tempId,
      sender_id: userId,
      content: inputText.trim(),
      created_at: new Date().toISOString(),
      pending: true // Mark as pending until confirmed
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputText('');
    
    // Auto expand the text input back to normal size
    Animated.timing(inputHeight, {
      toValue: 50,
      duration: 100,
      useNativeDriver: false
    }).start();
    
    // Scroll to the bottom after new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Send message to API
      const response = await matchingAPI.sendMessage({
        match_id: match.id,
        content: newMessage.content
      });
      
      // If successful, update the message to remove pending state
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
  
  const handleInputChange = (text) => {
    setInputText(text);
    
    // Animate height increase for multiline text
    const newHeight = Math.min(120, Math.max(50, text.split('\n').length * 24));
    Animated.timing(inputHeight, {
      toValue: newHeight,
      duration: 100,
      useNativeDriver: false
    }).start();
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
  
  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === userId;
    const showDateHeader = index === 0 || 
      formatMessageDate(item.created_at) !== formatMessageDate(messages[index - 1].created_at);
      
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeader}>{formatMessageDate(item.created_at)}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            item.pending && styles.pendingMessage,
            item.error && styles.errorMessage
          ]}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
              
              {item.pending && (
                <Ionicons name="time-outline" size={12} color={isOwnMessage ? "rgba(255,255,255,0.6)" : COLORS.textLight} style={styles.messageIcon} />
              )}
              
              {item.error && (
                <Ionicons name="alert-circle" size={12} color={COLORS.error} style={styles.messageIcon} />
              )}
              
              {!item.pending && !item.error && isOwnMessage && (
                <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.6)" style={styles.messageIcon} />
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  const renderChatHeader = () => {
    const jobTitle = match.job.title;
    
    return (
      <View style={styles.chatHeaderContainer}>
        <View style={styles.jobInfoContainer}>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
          <Text style={styles.matchDate}>
            Matched on {new Date(match.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </Text>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
          ListHeaderComponent={renderChatHeader}
          ListHeaderComponentStyle={styles.listHeader}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.inputWrapper, { height: inputHeight }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={handleInputChange}
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
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listHeader: {
    marginBottom: SPACING.l,
  },
  chatHeaderContainer: {
    padding: SPACING.m,
    backgroundColor: 'white',
    borderRadius: BORDERS.radiusMedium,
    margin: SPACING.m,
    ...SHADOWS.small,
  },
  jobInfoContainer: {
    marginLeft: SPACING.s,
  },
  jobTitle: {
    fontSize: FONTS.h4,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.text,
  },
  matchDate: {
    fontSize: FONTS.label,
    color: COLORS.textSecondary,
  },
  messagesList: {
    padding: SPACING.m,
    paddingBottom: SPACING.xl,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: SPACING.m,
  },
  dateHeader: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radiusLarge,
  },
  messageContainer: {
    marginVertical: SPACING.xs,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: SPACING.m,
    borderRadius: BORDERS.radiusLarge,
    ...SHADOWS.small,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: BORDERS.radiusSmall,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: BORDERS.radiusSmall,
  },
  pendingMessage: {
    opacity: 0.8,
  },
  errorMessage: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  messageText: {
    fontSize: FONTS.body,
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
    marginTop: SPACING.xs,
  },
  messageTime: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    marginRight: 5,
  },
  messageIcon: {
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 25,
    paddingHorizontal: SPACING.m,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    paddingRight: 40,
    fontSize: FONTS.body,
    color: COLORS.text,
    maxHeight: 120,
  },
  sendButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendingButton: {
    backgroundColor: COLORS.primaryLight,
  }
});

export default ChatScreen;