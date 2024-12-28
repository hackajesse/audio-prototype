import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from './ThemedText';
import IconSymbol from './ui/IconSymbol';

export default function StorageStatus() {
  const [freeSpace, setFreeSpace] = useState<number | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      try {
        const { freeDiskStorage } = await FileSystem.getFreeDiskStorageAsync();
        setFreeSpace(freeDiskStorage);
      } catch (error) {
        console.error('Error checking storage:', error);
      }
    };

    checkStorage();
    // Check storage every minute
    const interval = setInterval(checkStorage, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (freeSpace === null) return null;

  // Convert bytes to GB
  const freeSpaceGB = (freeSpace / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <View style={styles.container}>
      <IconSymbol name="storage" size={20} color="#666" />
      <ThemedText style={styles.text}>
        {freeSpaceGB}GB Free
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
  },
});
