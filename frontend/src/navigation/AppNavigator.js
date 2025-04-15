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

    // Handle deep links
    const handleDeepLink = (event) => {
        const { url } = event;
        if (url) {
            console.log("Deep link received:", url);

            // Check if it's a YouTube URL
            if (
                url.includes("youtube.com/watch") ||
                url.includes("youtu.be/") ||
                url.includes("m.youtube.com/watch")
            ) {
                // Navigate to home screen and pass the URL
                if (navigationRef.current) {
                    // Navigate to HomeTab first to ensure we're in the right stack
                    navigationRef.current.navigate("HomeTab");

                    // Then set the URL in the HomeScreen
                    // We'll need to modify HomeScreen to accept this parameter
                    setTimeout(() => {
                        navigationRef.current.navigate({
                            name: SCREENS.HOME,
                            params: { sharedUrl: url },
                            merge: true,
                        });
                    }, 100);
                }
            }
        }
    };

    // Set up deep link handling
    useEffect(() => {
        // Handle deep links when the app is already open
        const subscription = Linking.addEventListener("url", handleDeepLink);

        // Handle deep links that opened the app
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

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
