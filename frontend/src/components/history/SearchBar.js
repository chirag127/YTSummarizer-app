import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * SearchBar component for the History screen
 *
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Function to handle search input change
 * @param {Function} props.onClearSearch - Function to handle clearing the search
 * @returns {React.ReactElement} SearchBar component
 */
const SearchBar = ({ searchQuery, onSearchChange, onClearSearch }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        searchContainer: {
            marginBottom: SPACING.md,
        },
        searchInputContainer: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 8,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
        },
        searchIcon: {
            marginRight: SPACING.sm,
        },
        searchInput: {
            flex: 1,
            fontSize: FONT_SIZES.md,
            color: colors.text,
        },
        clearButton: {
            padding: SPACING.xs,
        },
    }));

    return (
        <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search summaries..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        onPress={onClearSearch}
                        style={styles.clearButton}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

SearchBar.propTypes = {
    searchQuery: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    onClearSearch: PropTypes.func.isRequired,
};

export default React.memo(SearchBar);
