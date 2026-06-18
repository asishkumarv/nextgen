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

// ─── Config per toast type ───────────────────────────────────────────────────
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

/**
 * Modern bottom-slide Toast notification
 *
 * Props:
 *   message  {string}                              Text to display
 *   type     {'error'|'success'|'warning'|'info'}  Toast variant
 *   visible  {boolean}                             Show / hide trigger
 *   onHide   {Function}                            Called after hide animation
 *   duration {number}                              Auto-dismiss ms (default 3500)
 */
export default function Toast({
  message = '',
  type    = 'error',
  visible = false,
  onHide,
  duration = 3500,
}) {
  // shouldRender controls whether we mount the component at all.
  // Starts false; becomes true when visible+message arrive, goes false after hide animation.
  const [shouldRender, setShouldRender] = useState(false);

  // Refs hold display content so they survive the async state update timing gap.
  // Refs update *synchronously* inside the effect, before the next render.
  const displayMsg  = useRef('');
  const displayType = useRef(type);

  // Animated values – created once
  const translateY = useRef(new Animated.Value(200)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.88)).current;
  const progress   = useRef(new Animated.Value(1)).current;
  const iconScale  = useRef(new Animated.Value(1)).current;

  const hideTimer  = useRef(null);
  const pulseLoop  = useRef(null);

  // Disable native driver on web platform as it is not supported and can stall/prevent animations.
  const useNative = Platform.OS !== 'web';

  // ── helpers ────────────────────────────────────────────────────────────────
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

  // ── show animation ─────────────────────────────────────────────────────────
  const animateIn = () => {
    // Reset progress bar
    progress.setValue(1);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0,  useNativeDriver: useNative, tension: 75, friction: 8 }),
      Animated.spring(scale,      { toValue: 1,  useNativeDriver: useNative, tension: 75, friction: 8 }),
      Animated.timing(opacity,    { toValue: 1,  duration: 200, useNativeDriver: useNative }),
    ]).start();

    // Drain progress bar
    Animated.timing(progress, { toValue: 0, duration, useNativeDriver: false }).start();

    startPulse();
    hideTimer.current = setTimeout(animateOut, duration);
  };

  // ── hide animation ─────────────────────────────────────────────────────────
  const animateOut = () => {
    clearHideTimer();
    stopPulse();

    Animated.parallel([
      Animated.timing(translateY, { toValue: 200, duration: 280, useNativeDriver: useNative }),
      Animated.timing(scale,      { toValue: 0.88, duration: 260, useNativeDriver: useNative }),
      Animated.timing(opacity,    { toValue: 0,   duration: 220, useNativeDriver: useNative }),
    ]).start(({ finished }) => {
      if (finished) {
        // Unmount after slide-out is complete
        setShouldRender(false);
        if (onHide) onHide();
      }
    });
  };

  // ── effect: respond to visible / message / type changes ──────────────────
  useEffect(() => {
    if (visible && message) {
      // 1. Update refs synchronously (no async gap)
      displayMsg.current  = message;
      displayType.current = type;

      // 2. Clear any running timer from a previous toast
      clearHideTimer();
      stopPulse();

      if (!shouldRender) {
        // Mount the component (triggers a re-render and initiates animateIn via the shouldRender effect)
        setShouldRender(true);
      } else {
        // If already rendered, reset positions and animate in again immediately
        translateY.setValue(200);
        scale.setValue(0.88);
        opacity.setValue(0);
        animateIn();
      }
    } else if (!visible && shouldRender) {
      // If parent sets visible to false, trigger the slide-out
      animateOut();
    }

    return () => {
      clearHideTimer();
      stopPulse();
    };
  }, [visible, message, type]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Once shouldRender flips to true, kick off the animation ───────────────
  useEffect(() => {
    if (shouldRender && displayMsg.current) {
      // Reset positions before animating in
      translateY.setValue(200);
      scale.setValue(0.88);
      opacity.setValue(0);
      animateIn();
    }
  }, [shouldRender]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Do not mount until we have content ────────────────────────────────────
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
      {/* Coloured left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: cfg.accentBar }]} />

      {/* Main card */}
      <View style={[styles.card, { backgroundColor: cfg.bg, borderColor: cfg.borderColor }]}>

        {/* Content row */}
        <View style={styles.row}>

          {/* Pulsing icon bubble */}
          <Animated.View
            style={[styles.iconBubble, { backgroundColor: cfg.iconBg, transform: [{ scale: iconScale }] }]}
          >
            <Ionicons name={cfg.icon} size={22} color={cfg.iconColor} />
          </Animated.View>

          {/* Text */}
          <View style={styles.textCol}>
            <Text style={[styles.typeLabel, { color: cfg.iconColor }]}>
              {cfg.label}
            </Text>
            <Text style={[styles.msgText, { color: cfg.textColor }]} numberOfLines={3}>
              {displayMsg.current}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={animateOut}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

        </View>

        {/* Draining progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth, backgroundColor: cfg.progressColor }]}
          />
        </View>

      </View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
