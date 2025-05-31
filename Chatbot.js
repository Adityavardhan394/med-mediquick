import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { AccessibilityWrapper } from './AccessibilityWrapper';

const Chatbot = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.API_URL, {
      auth: {
        token: user.token
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
    });

    socketRef.current.on('message', handleNewMessage);

    socketRef.current.on('error', (error) => {
      Alert.alert(t('chat.error'), error.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    if (message.type === 'VOICE' && message.audioUrl) {
      playAudioResponse(message.audioUrl);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert(t('chat.error'), t('chat.recordingError'));
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Convert audio to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        sendMessage(base64data, true);
      };
    } catch (error) {
      Alert.alert(t('chat.error'), t('chat.recordingError'));
    }
  };

  const playAudioResponse = async (audioUrl) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const sendMessage = async (content, isVoice = false) => {
    if (!content.trim() && !isVoice) return;

    setIsLoading(true);
    try {
      const message = {
        content,
        type: isVoice ? 'VOICE' : 'TEXT',
        sender: 'USER',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, message]);
      setInputText('');

      socketRef.current.emit('message', {
        ...message,
        sessionId,
        language: t('language')
      });
    } catch (error) {
      Alert.alert(t('chat.error'), t('chat.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'USER';
    return (
      <AccessibilityWrapper
        accessibilityRole="text"
        accessibilityLabel={`${item.sender} message: ${item.content}`}
      >
        <View style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage
        ]}>
          {item.type === 'VOICE' && (
            <TouchableOpacity
              onPress={() => playAudioResponse(item.audioUrl)}
              style={styles.voiceButton}
              accessibilityRole="button"
              accessibilityLabel={t('chat.playVoice')}
            >
              <MaterialIcons name="play-arrow" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
      </AccessibilityWrapper>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('chat.typeMessage')}
          placeholderTextColor="#666"
          multiline
          accessibilityLabel={t('chat.messageInput')}
        />
        <TouchableOpacity
          onPress={() => isRecording ? stopRecording() : startRecording()}
          style={[styles.voiceButton, isRecording && styles.recordingButton]}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? t('chat.stopRecording') : t('chat.startRecording')}
        >
          <MaterialIcons
            name={isRecording ? 'stop' : 'mic'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => sendMessage(inputText)}
          style={styles.sendButton}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={t('chat.sendMessage')}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialIcons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  messagesList: {
    padding: 16
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF'
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA'
  },
  messageText: {
    color: '#fff',
    fontSize: 16
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA'
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  recordingButton: {
    backgroundColor: '#FF3B30'
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default Chatbot; 