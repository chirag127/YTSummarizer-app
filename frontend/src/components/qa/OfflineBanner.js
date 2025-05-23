import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Component to display an offline banner
 *
 * @returns {React.ReactElement} OfflineBanner component
 */
const OfflineBanner = () => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        offlineBanner: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: `${colors.error}20`, // 20% opacity
            padding: SPACING.xs,
            borderRadius: 8,
            marginBottom: SPACING.xs,
            width: "100%",
        },
        offlineBannerText: {
            fontSize: FONT_SIZES.xs,
            color: colors.error,
            marginLeft: SPACING.xs,
            flex: 1,
        },
    }));

    return (
        <View style={styles.offlineBanner}>
            <Ionicons
                name="cloud-offline-outline"
                size={16}
                color={colors.error}
            />
            <Text style={styles.offlineBannerText}>
                You're offline. Questions will be answered when you're back
                online.
            </Text>
        </View>
    );
};

export default OfflineBanner;
