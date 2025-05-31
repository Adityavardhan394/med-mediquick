import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Chatbot from '../components/Chatbot';
import Navigation from '../components/Navigation';

const ChatScreen = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Chatbot />
      </View>
      <Navigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1,
    marginBottom: 60 // Space for navigation
  }
});

export default ChatScreen; 