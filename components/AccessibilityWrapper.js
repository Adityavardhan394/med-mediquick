import React from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';

const AccessibilityWrapper = ({ children, accessibilityLabel, accessibilityHint, accessibilityRole, accessibilityState, importantForAccessibility = 'auto' }) => {
  const { t } = useTranslation();
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = React.useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = React.useState(false);

  React.useEffect(() => {
    // Check initial screen reader status
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);

    // Listen for screen reader changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    // Check initial reduce motion status
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);

    // Listen for reduce motion changes
    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      screenReaderListener.remove();
      reduceMotionListener.remove();
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        isReduceMotionEnabled && styles.reduceMotion
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : undefined}
      accessibilityHint={accessibilityHint ? t(accessibilityHint) : undefined}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      importantForAccessibility={importantForAccessibility}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reduceMotion: {
    // Disable animations when reduce motion is enabled
    transform: [{ scale: 1 }],
  },
});

export default AccessibilityWrapper; 