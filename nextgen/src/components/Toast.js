import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const TOAST_CONFIG = {
  error: {
    bg: '#1F0A0A',
    border: '#EF4444',
    icon: 'alert-circle',
    iconColor: '#EF4444',
    textColor: '#FEE2E2',
  },
  success: {
    bg: '#052E16',
    border: '#10B981',
    icon: 'checkmark-circle',
    iconColor: '#10B981',
    textColor: '#D1FAE5',
  },
  warning: {
    bg: '#1C1207',
    border: '#F59E0B',
    icon: 'warning',
    iconColor: '#F59E0B',
    textColor: '#FEF3C7',
  },
  info: {
    bg: '#0C1A2E',
    border: '#0984E3',
    icon: 'information-circle',
    iconColor: '#0984E3',
    textColor: '#DBEAFE',
  },
};

/**
 * Toast component
 * @param {string} message  - Text to display
 * @param {'error'|'success'|'warning'|'info'} type - Toast type
 * @param {boolean} visible - Controls visibility
 * @param {Function} onHide - Callback when toast hides
 * @param {number} duration - Auto-hide duration (ms), default 3000
 */
export default function Toast({
  message = '',
  type = 'error',
  visible = false,
  onHide,
  duration = 3500,
}) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  const config = TOAST_CONFIG[type] || TOAST_CONFIG.error;

  const showToast = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      hideToast();
    }, duration);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  useEffect(() => {
    if (visible && message) {
      showToast();
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.iconWrapper, { backgroundColor: config.border + '22' }]}>
        <Ionicons name={config.icon} size={20} color={config.iconColor} />
      </View>
      <Text style={[styles.message, { color: config.textColor }]} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});
