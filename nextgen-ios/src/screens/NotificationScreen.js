import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';

const NotificationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { notifications, setUnreadNotificationCount, setNotifications } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res && res.success) {
        setNotifications(res.notifications);
        setUnreadNotificationCount(res.unreadCount);
        return res.notifications;
      }
    } catch (error) {
      console.warn('Failed to fetch notifications', error);
    }
    return null;
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications().then((fetchedNotifs) => {
        if (fetchedNotifs && fetchedNotifs.some(n => !n.is_read)) {
          markAllAsRead(fetchedNotifs);
        }
      });
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    await markAllAsRead();
    setRefreshing(false);
  };

  const markAllAsRead = async (currentNotifs = notifications) => {
    try {
      await api.put('/notifications/read-all');
      setUnreadNotificationCount(0);
      
      // Update local state to show all as read
      const updated = currentNotifs.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
    } catch (error) {
      console.warn('Failed to mark notifications as read', error);
    }
  };

  const getIconData = (type) => {
    switch(type) {
      case 'subscription':
        return { name: 'card-outline', color: '#3b82f6', bg: '#eff6ff' };
      case 'wallet':
        return { name: 'wallet-outline', color: '#10b981', bg: '#ecfdf5' };
      case 'vendor':
        return { name: 'person-outline', color: '#f59e0b', bg: '#fffbeb' };
      case 'task':
        return { name: 'checkmark-circle-outline', color: '#8b5cf6', bg: '#f5f3ff' };
      default:
        return { name: 'notifications-outline', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const renderItem = ({ item }) => {
    const iconData = getIconData(item.type);
    const dateStr = new Date(item.created_at).toLocaleDateString() + ' ' + new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.notificationCard, !item.is_read && styles.unreadCard]}>
        <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
          <Ionicons name={iconData.name} size={24} color={iconData.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{dateStr}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00B894']} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  listContent: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: '#f0fdf4',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
});

export default NotificationScreen;
