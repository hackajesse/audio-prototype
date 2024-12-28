import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Battery from 'expo-battery';
import { ThemedText } from './ThemedText';
import IconSymbol from './ui/IconSymbol';

export default function BatteryStatus() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    let batterySubscription: Battery.Subscription;

    const getBatteryState = async () => {
      const level = await Battery.getBatteryLevelAsync();
      const status = await Battery.getBatteryStateAsync();
      setBatteryLevel(level);
      setIsCharging(status === Battery.BatteryState.CHARGING);
    };

    const subscribeToBattery = async () => {
      batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        setBatteryLevel(batteryLevel);
      });

      Battery.addBatteryStateListener((state) => {
        setIsCharging(state.batteryState === Battery.BatteryState.CHARGING);
      });
    };

    getBatteryState();
    subscribeToBattery();

    return () => {
      if (batterySubscription) {
        batterySubscription.remove();
      }
    };
  }, []);

  if (batteryLevel === null) return null;

  return (
    <View style={styles.container}>
      <IconSymbol 
        name={isCharging ? "battery-charging-full" : "battery-full"} 
        size={20} 
      />
      <ThemedText style={styles.text}>
        {Math.round(batteryLevel * 100)}%
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
