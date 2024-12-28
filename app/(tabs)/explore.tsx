import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import AudioRecorder from '@/components/AudioRecorder';

export default function ExploreScreen() {
  return (
    <ThemedView style={styles.container}>
      <AudioRecorder />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
