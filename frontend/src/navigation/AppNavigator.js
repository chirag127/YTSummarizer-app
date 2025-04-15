import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";

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
        try {
            const { url } = event;
            if (!url) return;

            console.log("Deep link received in AppNavigator:", url);

            // Enhanced YouTube URL detection
            const isYouTubeUrl =
                url.includes("youtube.com/watch") ||
                url.includes("youtu.be/") ||
                url.includes("m.youtube.com/watch") ||
                // Additional patterns for mobile YouTube URLs
                url.includes("youtube.com/v/") ||
                url.includes("youtube.com/embed/") ||
                url.includes("youtube.app.goo.gl");

            if (isYouTubeUrl) {
                // Navigate to home screen and pass the URL
                if (navigationRef.current) {
                    console.log("Navigating to HomeTab with YouTube URL:", url);

                    // Navigate to HomeTab first to ensure we're in the right stack
                    navigationRef.current.navigate("HomeTab");

                    // Then set the URL in the HomeScreen with a delay to ensure navigation completes
                    setTimeout(() => {
                        console.log(
                            "Setting URL in HomeScreen for auto-processing:",
                            url
                        );
                        navigationRef.current.navigate({
                            name: SCREENS.HOME,
                            params: {
                                sharedUrl: url,
                                timestamp: new Date().getTime(), // Add timestamp to force update
                                autoProcess: true, // Flag to indicate automatic processing
                            },
                            merge: true,
                        });
                    }, 300); // Keep the same delay for reliability
                } else {
                    console.error("Navigation reference is not available");
                }
            } else {
                console.log("Received URL is not a YouTube URL:", url);
            }
        } catch (error) {
            console.error("Error handling deep link:", error);
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
                }, 300); // Reduced delay for faster response
                return;
            }

            // For Android and iOS, we rely on the intent filters and URL schemes
            // defined in app.json to handle shared content
            console.log(
                "Using Expo's built-in URL handling for shared content"
            );
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
                    tabBarIcon: ({ color, size }) => {
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
