import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const TOAST_CONFIG = {
  error: {
    bg: 'rgba(18, 4, 4, 0.97)',
    accentBar: '#EF4444',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    icon: 'alert-circle',
    iconColor: '#FF6B6B',
    iconBg: 'rgba(239, 68, 68, 0.16)',
    textColor: '#FFE4E4',
    progressColor: '#EF4444',
    label: 'Error',
  },
  success: {
    bg: 'rgba(3, 16, 9, 0.97)',
    accentBar: '#10B981',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: 'checkmark-circle',
    iconColor: '#34D399',
    iconBg: 'rgba(16, 185, 129, 0.16)',
    textColor: '#D1FAE5',
    progressColor: '#10B981',
    label: 'Success',
  },
  warning: {
    bg: 'rgba(16, 11, 2, 0.97)',
    accentBar: '#F59E0B',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: 'warning',
    iconColor: '#FCD34D',
    iconBg: 'rgba(245, 158, 11, 0.16)',
    textColor: '#FEF3C7',
    progressColor: '#F59E0B',
    label: 'Warning',
  },
  info: {
    bg: 'rgba(3, 9, 20, 0.97)',
    accentBar: '#3B82F6',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    icon: 'information-circle',
    iconColor: '#60A5FA',
    iconBg: 'rgba(59, 130, 246, 0.16)',
    textColor: '#DBEAFE',
    progressColor: '#3B82F6',
    label: 'Info',
  },
};

export default function Toast({
  message = '',
  type    = 'error',
  visible = false,
  onHide,
  duration = 3500,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const displayMsg  = useRef('');
  const displayType = useRef(type);

  const translateY = useRef(new Animated.Value(200)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.88)).current;
  const progress   = useRef(new Animated.Value(1)).current;
  const iconScale  = useRef(new Animated.Value(1)).current;

  const hideTimer  = useRef(null);
  const pulseLoop  = useRef(null);

  const useNative = Platform.OS !== 'web';

  const clearHideTimer = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
  };

  const stopPulse = () => {
    if (pulseLoop.current) { pulseLoop.current.stop(); pulseLoop.current = null; }
    iconScale.setValue(1);
  };

  const startPulse = () => {
    stopPulse();
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.2,  duration: 650, useNativeDriver: useNative }),
        Animated.timing(iconScale, { toValue: 1,    duration: 650, useNativeDriver: useNative }),
      ])
    );
    pulseLoop.current.start();
  };

  const animateIn = () => {
    progress.setValue(1);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0,  useNativeDriver: useNative, tension: 75, friction: 8 }),
      Animated.spring(scale,      { toValue: 1,  useNativeDriver: useNative, tension: 75, friction: 8 }),
      Animated.timing(opacity,    { toValue: 1,  duration: 200, useNativeDriver: useNative }),
    ]).start();

    Animated.timing(progress, { toValue: 0, duration, useNativeDriver: false }).start();

    startPulse();
    hideTimer.current = setTimeout(animateOut, duration);
  };

  const animateOut = () => {
    clearHideTimer();
    stopPulse();

    Animated.parallel([
      Animated.timing(translateY, { toValue: 200, duration: 280, useNativeDriver: useNative }),
      Animated.timing(scale,      { toValue: 0.88, duration: 260, useNativeDriver: useNative }),
      Animated.timing(opacity,    { toValue: 0,   duration: 220, useNativeDriver: useNative }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
        if (onHide) onHide();
      }
    });
  };

  useEffect(() => {
    if (visible && message) {
      displayMsg.current  = message;
      displayType.current = type;
      clearHideTimer();
      stopPulse();

      if (!shouldRender) {
        setShouldRender(true);
      } else {
        translateY.setValue(200);
        scale.setValue(0.88);
        opacity.setValue(0);
        animateIn();
      }
    } else if (!visible && shouldRender) {
      animateOut();
    }

    return () => {
      clearHideTimer();
      stopPulse();
    };
  }, [visible, message, type]);

  useEffect(() => {
    if (shouldRender && displayMsg.current) {
      translateY.setValue(200);
      scale.setValue(0.88);
      opacity.setValue(0);
      animateIn();
    }
  }, [shouldRender]);

  if (!shouldRender || !displayMsg.current) return null;

  const cfg = TOAST_CONFIG[displayType.current] || TOAST_CONFIG.error;

  const progressWidth = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: cfg.accentBar }]} />
      <View style={[styles.card, { backgroundColor: cfg.bg, borderColor: cfg.borderColor }]}>
        <View style={styles.row}>
          <Animated.View
            style={[styles.iconBubble, { backgroundColor: cfg.iconBg, transform: [{ scale: iconScale }] }]}
          >
            <Ionicons name={cfg.icon} size={22} color={cfg.iconColor} />
          </Animated.View>
          <View style={styles.textCol}>
            <Text style={[styles.typeLabel, { color: cfg.iconColor }]}>
              {cfg.label}
            </Text>
            <Text style={[styles.msgText, { color: cfg.textColor }]} numberOfLines={3}>
              {displayMsg.current}
            </Text>
          </View>
          <TouchableOpacity
            onPress={animateOut}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth, backgroundColor: cfg.progressColor }]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 30,
    left: 12,
    right: 12,
    zIndex: 99999,
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 20,
  },
  accentBar: {
    width: 5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  card: {
    flex: 1,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 0,
    paddingTop: 13,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingBottom: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  textCol: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  msgText: {
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
  },
  closeBtn: {
    paddingTop: 3,
    flexShrink: 0,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: -14,
    marginBottom: 0,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
});
