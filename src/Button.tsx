import { StyleProp, Text, TextStyle, TouchableOpacity, View } from 'react-native';

type ButtonProps = {
  onPress: () => void;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
};

export const Button: React.FC<ButtonProps> = ({ onPress, title, titleStyle }) => {
  return (
    <View>
      <TouchableOpacity onPress={onPress}>
        <Text style={titleStyle}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
};
