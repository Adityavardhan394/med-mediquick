import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'es', name: 'Español' }
  ];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <View style={styles.container}>
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageButton,
            i18n.language === language.code && styles.activeLanguage
          ]}
          onPress={() => changeLanguage(language.code)}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${language.name}`}
          accessibilityState={{ selected: i18n.language === language.code }}
        >
          <Text style={[
            styles.languageText,
            i18n.language === language.code && styles.activeLanguageText
          ]}>
            {language.name}
          </Text>
          {i18n.language === language.code && (
            <MaterialIcons name="check" size={20} color="#00b386" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  activeLanguage: {
    backgroundColor: '#e6f7f3',
  },
  languageText: {
    fontSize: 14,
    color: '#666',
  },
  activeLanguageText: {
    color: '#00b386',
    fontWeight: '600',
  },
});

export default LanguageSwitcher; 