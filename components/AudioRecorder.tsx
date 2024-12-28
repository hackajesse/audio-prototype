import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ScrollView, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Battery from 'expo-battery';

interface Recording {
  uri: string;
  filename: string;
  title: string;
  size?: number;
  duration?: number;
}

const CIRCLE_RADIUS = 70; // slightly larger than the button

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#333',
  },
  header: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  batteryText: {
    color: '#fff',
    fontSize: 16,
  },
  statusContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#fff',
  },
  durationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notRecording: {
    backgroundColor: '#ff4444',
  },
  recordDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stopButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingsContainer: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  recordingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  recordingsList: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  recordingMainInfo: {
    flex: 1,
    gap: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#fff',
  },
  fileSizeText: {
    color: '#999',
    fontSize: 12,
  },
  recordingControls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    padding: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingVertical: 4,
  },
  editIcon: {
    opacity: 0.6,
  },
});

const AudioRecorder: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingFile, setCurrentPlayingFile] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let batterySubscription: Battery.Subscription;

    const subscribeToBattery = async () => {
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(level);

      batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        setBatteryLevel(batteryLevel);
      });
    };

    subscribeToBattery();

    return () => {
      if (batterySubscription) {
        batterySubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 50); // Update every 50ms
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${Math.floor(milliseconds / 100)}`;
  };

  const formatTimestamp = (filename: string): string => {
    const timestamp = filename.split('-')[1]?.split('.')[0];
    if (timestamp) {
      const date = new Date(parseInt(timestamp));
      return date.toLocaleString();
    }
    return filename;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  };

  const updateRecordingTitle = async (index: number, newTitle: string) => {
    const updatedRecordings = [...recordings];
    updatedRecordings[index] = {
      ...updatedRecordings[index],
      title: newTitle
    };
    setRecordings(updatedRecordings);
    setEditingIndex(null);
    setEditingTitle(null);
  };

  const loadRecordings = async () => {
    const audioDir = FileSystem.documentDirectory + 'audio/';
    try {
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
        return;
      }

      const files = await FileSystem.readDirectoryAsync(audioDir);
      const audioFiles = files.filter(file => file.endsWith('.m4a'));
      
      const recordingsList = await Promise.all(audioFiles.map(async filename => {
        const uri = audioDir + filename;
        const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
        return {
          uri,
          filename,
          title: formatTimestamp(filename),
          size: fileInfo.exists ? fileInfo.size : 0,
        };
      }));
      
      setRecordings(recordingsList.reverse());
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        const fileName = `recording-${Date.now()}.m4a`;
        const newUri = FileSystem.documentDirectory + 'audio/' + fileName;
        await FileSystem.moveAsync({ from: uri, to: newUri });
        await loadRecordings(); // Refresh the recordings list
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }

    setRecording(null);
    setIsRecording(false);
  };

  const pauseRecording = async () => {
    if (!recording) return;
    try {
      await recording.pauseAsync();
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    if (!recording) return;
    try {
      await recording.startAsync();
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const playRecording = async (recordingUri: string) => {
    try {
      // Stop current playback if any
      if (sound) {
        await sound.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);
      setCurrentPlayingFile(recordingUri);

      // Listen for playback status
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status && 'didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentPlayingFile(null);
        }
      });

    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setCurrentPlayingFile(null);
    }
  };

  const deleteRecording = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri);
      await loadRecordings(); // Refresh the recordings list
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.batteryContainer}>
          <FontAwesome name="battery-3" size={20} color="#fff" />
          <Text style={styles.batteryText}>{Math.round(batteryLevel * 100)}%</Text>
        </View>
        <Text style={styles.durationText}>
          {isRecording ? formatDuration(recordingDuration) : "0:00.0"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
        >
          <View style={[styles.recordButtonInner, !isRecording && styles.notRecording]}>
            {isRecording ? (
              <FontAwesome 
                name={isPaused ? "play" : "pause"} 
                size={40} 
                color="#fff" 
              />
            ) : (
              <View style={styles.recordDot} />
            )}
          </View>
        </TouchableOpacity>

        {isRecording && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
          >
            <View style={styles.stopButtonInner}>
              <FontAwesome name="stop" size={30} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.recordingsList}>
        {recordings.map((recording, index) => (
          <View key={index} style={styles.recordingItem}>
            <View style={styles.recordingMainInfo}>
              {editingIndex === index ? (
                <TextInput
                  style={styles.titleInput}
                  value={editingTitle || recording.title}
                  onChangeText={setEditingTitle}
                  onBlur={() => {
                    if (editingTitle) {
                      updateRecordingTitle(index, editingTitle);
                    }
                  }}
                  onSubmitEditing={() => {
                    if (editingTitle) {
                      updateRecordingTitle(index, editingTitle);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <TouchableOpacity 
                  style={styles.titleContainer}
                  onPress={() => {
                    setEditingIndex(index);
                    setEditingTitle(recording.title);
                  }}
                >
                  <Text style={styles.recordingText}>{recording.title}</Text>
                  <FontAwesome name="pencil" size={16} color="#999" style={styles.editIcon} />
                </TouchableOpacity>
              )}
              <Text style={styles.fileSizeText}>
                {formatFileSize(recording.size || 0)}
              </Text>
            </View>
            <View style={styles.recordingControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => deleteRecording(recording.uri)}
              >
                <FontAwesome name="trash" size={20} color="#ff4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  if (currentPlayingFile === recording.uri) {
                    stopPlayback();
                  } else {
                    playRecording(recording.uri);
                  }
                }}
              >
                <FontAwesome 
                  name={currentPlayingFile === recording.uri ? "stop" : "play"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default AudioRecorder;
