import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { COLORS } from "../theme/colors";

type Props = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  rightIconName?: React.ComponentProps<typeof Ionicons>["name"];
  bgColor?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  style,
  rightIconName,
  bgColor = COLORS.primary,
  textColor = COLORS.onPrimary,
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, opacity: isDisabled ? 0.55 : 1 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        {}
        <View style={styles.textWrapper}>
          <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightSlot}>
          {loading ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : rightIconName ? (
            <Ionicons name={rightIconName} size={20} color={textColor} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 8,
  },
  textWrapper: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  rightSlot: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});