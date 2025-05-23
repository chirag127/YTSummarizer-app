import React from "react";
import { TouchableOpacity, Text, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

const TTSTestButton = ({ settings, isSaving }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        testButton: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: SPACING.md,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: SPACING.xl,
        },
        testButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            marginLeft: SPACING.sm,
        },
    }));

    // Test TTS
    const testTTS = async () => {
        try {
            await Speech.stop();
            await Speech.speak(
                "This is a test of the text-to-speech settings.",
                {
                    rate: settings.rate,
                    pitch: settings.pitch,
                    voice: settings.voice,
                }
            );
        } catch (error) {
            console.error("Error testing TTS:", error);
            Alert.alert("Error", "Failed to test text-to-speech.");
        }
    };

    return (
        <TouchableOpacity
            style={styles.testButton}
            onPress={testTTS}
            disabled={isSaving}
        >
            <Ionicons name="volume-high" size={20} color={colors.background} />
            <Text style={styles.testButtonText}>Test Voice Settings</Text>
        </TouchableOpacity>
    );
};

export default TTSTestButton;
