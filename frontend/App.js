import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, Platform, Linking } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import * as IntentLauncher from "expo-intent-launcher";

export default function App() {
    // Handle shared content at the app level
    useEffect(() => {
        // Function to handle initial URL
        const handleInitialURL = async () => {
            try {
                // Get the URL that opened the app
                const initialUrl = await Linking.getInitialURL();
                if (initialUrl) {
                    console.log("App opened with URL:", initialUrl);
                }
            } catch (error) {
                console.error("Error handling initial URL:", error);
            }
        };

        // Set up URL event listener
        const handleURLEvent = (event) => {
            console.log("URL event received:", event.url);
        };

        // Check for initial URL
        handleInitialURL();

        // Add event listener for URL events
        const subscription = Linking.addEventListener("url", handleURLEvent);

        // Clean up
        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.container}>
                <StatusBar style="auto" />
                <AppNavigator />
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
