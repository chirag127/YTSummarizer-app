import React from "react";
import { StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { COLORS, SPACING, FONT_SIZES } from "../../constants";

const TTSTestButton = ({ settings, isSaving }) => {
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
            <Ionicons
                name="volume-high"
                size={20}
                color={COLORS.background}
            />
            <Text style={styles.testButtonText}>Test Voice Settings</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    testButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: SPACING.md,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: SPACING.xl,
    },
    testButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
        marginLeft: SPACING.sm,
    },
});

export default TTSTestButton;
