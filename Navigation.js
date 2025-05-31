import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { AccessibilityWrapper } from './AccessibilityWrapper';

const Navigation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AccessibilityWrapper
        accessibilityRole="tab"
        accessibilityLabel={t('navigation.home')}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <MaterialIcons name="home" size={24} color="#007AFF" />
        </TouchableOpacity>
      </AccessibilityWrapper>

      <AccessibilityWrapper
        accessibilityRole="tab"
        accessibilityLabel={t('navigation.search')}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Search')}
        >
          <MaterialIcons name="search" size={24} color="#007AFF" />
        </TouchableOpacity>
      </AccessibilityWrapper>

      <AccessibilityWrapper
        accessibilityRole="tab"
        accessibilityLabel={t('navigation.chat')}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Chat')}
        >
          <MaterialIcons name="chat" size={24} color="#007AFF" />
        </TouchableOpacity>
      </AccessibilityWrapper>

      <AccessibilityWrapper
        accessibilityRole="tab"
        accessibilityLabel={t('navigation.profile')}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialIcons name="person" size={24} color="#007AFF" />
        </TouchableOpacity>
      </AccessibilityWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60
  },
  navButton: {
    padding: 10,
    borderRadius: 20
  }
});

export default Navigation; 