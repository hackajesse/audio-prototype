import { useEffect } from 'react';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const BACKGROUND_RECORDING_TASK = 'background-recording';

export function useBackgroundRecording() {
  useEffect(() => {
    registerBackgroundTask();
    return () => {
      unregisterBackgroundTask();
    };
  }, []);

  const registerBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_RECORDING_TASK, {
        minimumInterval: 60, // 1 minute
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (err) {
      console.log('Task Register failed:', err);
    }
  };

  const unregisterBackgroundTask = async () => {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_RECORDING_TASK);
    } catch (err) {
      console.log('Task Unregister failed:', err);
    }
  };
}

TaskManager.defineTask(BACKGROUND_RECORDING_TASK, async () => {
  try {
    // Check if audio recording is permitted
    const { granted } = await Audio.getPermissionsAsync();
    if (!granted) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Ensure audio directory exists
    const audioDir = FileSystem.documentDirectory + 'audio/';
    const dirInfo = await FileSystem.getInfoAsync(audioDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Start recording
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();

    // Record for a set duration (e.g., 30 seconds)
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Stop and save recording
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (uri) {
      const fileName = `background-recording-${Date.now()}.m4a`;
      const newUri = audioDir + fileName;
      await FileSystem.moveAsync({ from: uri, to: newUri });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});