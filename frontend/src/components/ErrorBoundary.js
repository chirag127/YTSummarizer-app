import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { COLORS, SPACING, FONT_SIZES } from "../constants";

// We're reverting back to using COLORS from constants to avoid the circular dependency
// with ThemeContext, which would cause the error when the app first loads
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Render fallback UI
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.toString() ||
                            "An unexpected error occurred"}
                    </Text>
                    <Button
                        title="Try Again"
                        onPress={this.resetError}
                        color={COLORS.primary}
                    />
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: SPACING.lg,
        backgroundColor: COLORS.background,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: "bold",
        marginBottom: SPACING.md,
        color: COLORS.error,
    },
    message: {
        fontSize: FONT_SIZES.md,
        textAlign: "center",
        marginBottom: SPACING.lg,
        color: COLORS.text,
    },
});

export default ErrorBoundary;
