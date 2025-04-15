import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Platform } from "react-native";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import SummaryScreen from "../screens/SummaryScreen";
import HistoryScreen from "../screens/HistoryScreen";
import SettingsScreen from "../screens/SettingsScreen";

// Import constants
import { SCREENS, COLORS, TAB_ICONS } from "../constants";

// Create navigators
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// Home stack navigator
const HomeStackNavigator = () => {
    return (
        <HomeStack.Navigator>
            <HomeStack.Screen
                name={SCREENS.HOME}
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <HomeStack.Screen
                name={SCREENS.SUMMARY}
                component={SummaryScreen}
                options={{ title: "Summary" }}
            />
        </HomeStack.Navigator>
    );
};

// Main tab navigator
const AppNavigator = () => {
    const navigationRef = useRef(null);

    // Handle deep links and shared content
    const handleDeepLink = (event) => {
        const { url } = event;
        if (url) {
            console.log("Deep link received in AppNavigator:", url);

            // Check if it's a YouTube URL
            if (
                url.includes("youtube.com/watch") ||
                url.includes("youtu.be/") ||
                url.includes("m.youtube.com/watch")
            ) {
                // Navigate to home screen and pass the URL
                if (navigationRef.current) {
                    console.log("Navigating to HomeTab with URL:", url);

                    // Navigate to HomeTab first to ensure we're in the right stack
                    navigationRef.current.navigate("HomeTab");

                    // Then set the URL in the HomeScreen with a delay to ensure navigation completes
                    setTimeout(() => {
                        console.log("Setting URL in HomeScreen:", url);
                        navigationRef.current.navigate({
                            name: SCREENS.HOME,
                            params: {
                                sharedUrl: url,
                                timestamp: new Date().getTime(), // Add timestamp to force update
                            },
                            merge: true,
                        });
                    }, 300); // Increased delay for more reliable navigation
                }
            }
        }
    };

    // Handle shared text (like URLs)
    const handleSharedText = async () => {
        try {
            // Get the initial URL that opened the app
            const initialURL = await Linking.getInitialURL();

            // Check if we have an initial URL
            if (initialURL) {
                console.log(
                    "App opened with URL in handleSharedText:",
                    initialURL
                );
                // Process the URL with a slight delay to ensure app is fully loaded
                setTimeout(() => {
                    handleDeepLink({ url: initialURL });
                }, 500);
                return;
            }

            // For iOS, we need to check if the app was opened from a share extension
            if (Platform.OS === "ios") {
                // iOS share handling is primarily done through universal links
                // and the URL handling above
                console.log("Checking for iOS shared content...");

                // On iOS, we can also check for shared text via Clipboard as a fallback
                try {
                    // This would require a native module in a real app
                    // For now, we'll rely on the URL handling
                } catch (err) {
                    console.error("Error checking iOS shared content:", err);
                }
            }

            // On Android, check if app was opened from share intent
            if (Platform.OS === "android") {
                try {
                    console.log("Checking for Android shared content...");

                    // In a real implementation, you would use a native module to get the shared text
                    // For example, using react-native-receive-sharing-intent or a custom native module

                    // For now, we'll rely on the URL handling via Linking.getInitialURL()
                    // which should work for most share intents that include a URL
                } catch (err) {
                    console.error("Error checking Android intent:", err);
                }
            }
        } catch (error) {
            console.error("Error handling shared text:", error);
        }
    };

    // Set up deep link and share handling
    useEffect(() => {
        // Handle deep links when the app is already open
        const subscription = Linking.addEventListener("url", handleDeepLink);

        // Handle shared content and deep links that opened the app
        handleSharedText();

        return () => {
            // Clean up the event listener
            subscription.remove();
        };
    }, []);

    return (
        <NavigationContainer ref={navigationRef}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        const iconName = TAB_ICONS[route.name] || "help-circle";
                        return (
                            <Ionicons
                                name={iconName}
                                size={size}
                                color={color}
                            />
                        );
                    },
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: COLORS.textSecondary,
                    headerShown: route.name !== SCREENS.HOME,
                })}
            >
                <Tab.Screen
                    name="HomeTab"
                    component={HomeStackNavigator}
                    options={{
                        headerShown: false,
                        title: "Home",
                    }}
                />
                <Tab.Screen
                    name={SCREENS.HISTORY}
                    component={HistoryScreen}
                    options={{ title: "History" }}
                />
                <Tab.Screen
                    name={SCREENS.SETTINGS}
                    component={SettingsScreen}
                    options={{ title: "Settings" }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
