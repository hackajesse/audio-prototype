import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import BatteryStatus from './BatteryStatus';
import StorageStatus from './StorageStatus';
import { ThemedText } from './ThemedText';
import IconSymbol from './ui/IconSymbol';
import { useBackgroundRecording } from '@/hooks/useBackgroundRecording';

const RecordingInterface: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [isRecording, recording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Permission to record was denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError('Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped, file saved at:', uri);
      setLastRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      const error = err as Error;
      setError('Failed to stop recording: ' + error.message);
    }
  };

  const deleteRecording = async () => {
    if (!lastRecordingUri) return;

    try {
      await FileSystem.deleteAsync(lastRecordingUri);
      setLastRecordingUri(null);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError('Failed to delete recording: ' + error.message);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <BatteryStatus />
        <StorageStatus />
      </View>
      
      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}
      
      <View style={styles.recordingInfo}>
        <ThemedText style={styles.duration}>
          {isRecording ? formatDuration(recordingDuration) : "0:00"}
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recording]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <IconSymbol
            name={isRecording ? "stop" : "fiber-manual-record"}
            size={40}
            color={isRecording ? "#fff" : "#ff4444"}
          />
        </TouchableOpacity>

        {lastRecordingUri && !isRecording && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteRecording}
          >
            <IconSymbol
              name="delete-forever"
              size={30}
              color="#ff4444"
              style={styles.deleteIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  recordingInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  duration: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recording: {
    backgroundColor: '#ff4444',
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteIcon: {
    marginRight: 0,
  },
  errorText: {
    color: '#ff4444',
    marginVertical: 10,
  },
});

export default RecordingInterface;
