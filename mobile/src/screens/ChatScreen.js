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
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
  
  const flatListRef = useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const type = await AsyncStorage.getItem('userType');
        setUserType(type);
        
        // In a real app, fetch real messages from API
        // For now, using sample data with a delay to simulate loading
        setTimeout(() => {
          setMessages(SAMPLE_MESSAGES);
          setLoading(false);
        }, 500);
        
        // Set the chat title
        const chatName = userType === 'job_seeker' 
          ? match.job.recruiter.company_name
          : `${match.job_seeker.profile.user.first_name} ${match.job_seeker.profile.user.last_name}`;
          
        navigation.setOptions({
          title: chatName,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontSize: 18,
            color: '#333',
          },
          headerBackTitle: 'Back',
        });
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigation, match, userType]);
  
  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender_id: userId,
      content: inputText.trim(),
      created_at: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputText('');
    
    // Scroll to the bottom after new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender_id === userId;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
      </View>
    );
  };
  
  const renderChatHeader = () => {
    const jobTitle = match.job.title;
    
    return (
      <View style={styles.chatHeaderContainer}>
        <View style={styles.jobInfoContainer}>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
          <Text style={styles.matchDate}>
            Matched on {new Date(match.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
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
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !inputText.trim() ? styles.sendButtonDisabled : {}
            ]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={!inputText.trim() ? '#ccc' : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listHeader: {
    marginBottom: 20,
  },
  chatHeaderContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  jobInfoContainer: {
    marginLeft: 10,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  matchDate: {
    fontSize: 14,
    color: '#888',
  },
  messagesList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 5,
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
    padding: 12,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#ff6b6b',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#e5e5e5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingRight: 40,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    position: 'absolute',
    right: 24,
    bottom: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
});

export default ChatScreen;