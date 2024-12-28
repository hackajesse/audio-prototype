import React from 'react';
import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import IconSymbol from '@/components/ui/IconSymbol';
import RecordingInterface from '@/components/RecordingInterface';

export default function ExploreScreen() {
  return (
    <ParallaxScrollView
      headerImage={<IconSymbol name="graphic-eq" size={100} />}
      headerBackgroundColor={{
        dark: '#1c1c1c',
        light: '#f0f0f0'
      }}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Audio Recording</ThemedText>
        
        <RecordingInterface />

        <Collapsible title="About">
          <ThemedText style={styles.text}>
            This is a prototype audio recording interface. Tap the button to start/stop recording.
          </ThemedText>
        </Collapsible>

        <ExternalLink
          style={styles.link}
          href="https://docs.expo.dev/versions/latest/sdk/av/">
          <IconSymbol name="info" />
          <ThemedText>Learn more about Expo AV</ThemedText>
        </ExternalLink>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
});
