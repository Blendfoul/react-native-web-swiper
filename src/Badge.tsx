import { StyleSheet, Text, View, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';

import { renderNode } from './renderNode';

type BadgeProps = {
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  badgeStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  Component?: React.ElementType;
  value?: React.ReactNode;
  theme?: object;
  status?: 'primary' | 'success' | 'warning' | 'error';
};

const Badge: React.FC<BadgeProps> = ({
  containerStyle,
  textStyle,
  badgeStyle,
  onPress,
  Component = onPress ? TouchableOpacity : View,
  value,
  theme,
  status = 'primary',
  ...attributes
}) => {

  const element = renderNode(Text, value, {
    style: StyleSheet.flatten([styles.text, textStyle && textStyle]),
  });

  return (
    <View style={StyleSheet.flatten([containerStyle && containerStyle])}>
      <Component
        {...attributes}
        style={StyleSheet.flatten([
          styles.badge(theme, status),
          !element && styles.miniBadge,
          badgeStyle && badgeStyle,
        ])}
        onPress={onPress}
      >
        {element}
      </Component>
    </View>
  );
};

const size = 18;
const miniSize = 8;

const styles: {
  badge: (theme: any, status: string) => ViewStyle;
  miniBadge: ViewStyle;
  text: TextStyle;
} = {
  badge: (theme, status) => ({
    alignSelf: 'center',
    minWidth: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors[status],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fff',
  }),
  miniBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: miniSize,
    height: miniSize,
    borderRadius: miniSize / 2,
  },
  text: {
    fontSize: 12,
    color: 'white',
    paddingHorizontal: 4,
  },
};

export { Badge };
