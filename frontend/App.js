import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, Platform, Linking } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import * as IntentLauncher from "expo-intent-launcher";
import { NetworkProvider } from "./src/context/NetworkContext";
import NetworkStatusIndicator from "./src/components/NetworkStatusIndicator";
import * as cacheService from "./src/services/cacheService";
import { registerBackgroundTasks } from "./src/tasks/backgroundTasks";

export default function App() {
    // Initialize cache and register background tasks
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Initialize cache
                await cacheService.initializeCache();
                console.log("Cache initialized");

                // Register background tasks
                await registerBackgroundTasks();
                console.log("Background tasks registered");
            } catch (error) {
                console.error("Error initializing app:", error);
            }
        };

        initializeApp();
    }, []);

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
        <NetworkProvider>
            <GestureHandlerRootView style={styles.container}>
                <View style={styles.container}>
                    <StatusBar style="auto" />
                    <NetworkStatusIndicator />
                    <AppNavigator />
                </View>
            </GestureHandlerRootView>
        </NetworkProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
