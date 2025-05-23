import React from "react";
import { View, Text, Button } from "react-native";
import { COLORS, SPACING, FONT_SIZES } from "../constants";

// We need to use COLORS from constants in ErrorBoundary to avoid circular dependency
// with ThemeContext, which would cause the error when the app first loads
// Note: We can't use useTheme or useThemedStyles here because this is a class component
// and it needs to work even if ThemeContext is not available
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
            // Render fallback UI with inline styles
            // We use inline styles here because this is a class component
            // and we can't use hooks like useTheme or useThemedStyles
            return (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: SPACING.lg,
                        backgroundColor: COLORS.background,
                    }}
                >
                    <Text
                        style={{
                            fontSize: FONT_SIZES.xl,
                            fontWeight: "bold",
                            marginBottom: SPACING.md,
                            color: COLORS.error,
                        }}
                    >
                        Something went wrong
                    </Text>
                    <Text
                        style={{
                            fontSize: FONT_SIZES.md,
                            textAlign: "center",
                            marginBottom: SPACING.lg,
                            color: COLORS.text,
                        }}
                    >
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

export default ErrorBoundary;
