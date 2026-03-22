import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
} from 'react-native';
import { COLORS } from '../../navigation/AppNavigator';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  color?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  message,
  fullScreen = false,
  color = COLORS.accent,
}: LoadingSpinnerProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rotateAnim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnim.start();
    pulseAnim.start();

    return () => {
      rotateAnim.stop();
      pulseAnim.stop();
    };
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerSize = size === 'small' ? 24 : size === 'medium' ? 36 : 52;
  const borderWidth = size === 'small' ? 2 : size === 'medium' ? 3 : 4;

  const spinner = (
    <View style={[fullScreen && styles.fullScreen]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            borderWidth,
            borderColor: `${color}30`,
            borderTopColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {message && (
        <Animated.Text
          style={[styles.message, { opacity: pulse }]}
        >
          {message}
        </Animated.Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.card}>
          {spinner}
        </View>
      </View>
    );
  }

  return spinner;
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  spinner: {},
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
