import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

export default function ServiceCard({ item }) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.sub}>{item.subtitle}</Text>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.price}>₹{item.price}</Text>

        <TouchableOpacity>
          <LinearGradient
            colors={['#00C853', '#00B0FF']}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Book</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sub: {
    color: '#6B7280',
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#00B894',
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});