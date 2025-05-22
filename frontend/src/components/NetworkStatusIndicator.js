import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import useThemedStyles from "../hooks/useThemedStyles";

const NetworkStatusIndicator = () => {
    const { isConnected, isInternetReachable } = useNetwork();
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const translateY = new Animated.Value(-50);

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        container: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.error,
            padding: 5,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
        },
        text: {
            color: colors.background,
            marginLeft: 5,
            fontWeight: "bold",
        },
    }));

    // Determine if we should show the indicator
    const isOffline = !isConnected || !isInternetReachable;

    useEffect(() => {
        if (isOffline) {
            setVisible(true);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: -50,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setVisible(false);
            });
        }
    }, [isOffline]);

    if (!visible && !isOffline) return null;

    return (
        <Animated.View
            style={[styles.container, { transform: [{ translateY }] }]}
        >
            <Ionicons
                name="cloud-offline-outline"
                size={18}
                color={colors.background}
            />
            <Text style={styles.text}>You are offline</Text>
        </Animated.View>
    );
};

export default NetworkStatusIndicator;
