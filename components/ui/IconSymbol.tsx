import React from 'react';
import { StyleSheet, StyleProp, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface IconSymbolProps {
  name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

const IconSymbol: React.FC<IconSymbolProps> = ({ name, size = 24, color = '#000', style }) => {
  return <MaterialIcons name={name} size={size} color={color} style={[styles.icon, style]} />;
};

const styles = StyleSheet.create({
  icon: {
    marginRight: 8,
  },
});

export default IconSymbol;
