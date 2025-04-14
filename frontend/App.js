import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
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
