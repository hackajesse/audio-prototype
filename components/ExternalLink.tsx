import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Text } from './ThemedText';
import * as Linking from 'expo-linking';

interface Props {
  href: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ExternalLink({ href, children, style }: Props) {
  return (
    <Pressable style={style} onPress={() => Linking.openURL(href)}>
      <Text>{children}</Text>
    </Pressable>
  );
}
