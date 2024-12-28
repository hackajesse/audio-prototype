import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { ThemedText } from './ThemedText';
import IconSymbol from './ui/IconSymbol';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export default function LocationTracker() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const startLocationTracking = async () => {
      try {
        // Request foreground permissions
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        // Request background permissions
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          Alert.alert(
            'Limited Functionality',
            'Background location access was denied. Location tracking will only work while the app is open.'
          );
        }

        // Start location updates
        await Location.startLocationUpdatesAsync('location-tracking', {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
          foregroundService: {
            notificationTitle: 'Location Tracking Active',
            notificationBody: 'Recording your location in the background',
          },
        });

        // Also start foreground updates for immediate feedback
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              timestamp: newLocation.timestamp,
            });
          }
        );
      } catch (error) {
        setErrorMsg('Error starting location tracking: ' + (error instanceof Error ? error.message : String(error)));
      }
    };

    startLocationTracking();

    // Cleanup function
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      Location.stopLocationUpdatesAsync('location-tracking').catch(console.error);
    };
  }, []);

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <IconSymbol 
          name="location-on" 
          size={20} 
          color={location ? "#4CAF50" : "#666"}
        />
        <ThemedText style={styles.coordinates}>
          {location ? 
            `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 
            'Waiting for location...'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinates: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorText: {
    color: 'red',
  },
});
