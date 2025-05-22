import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Switch,
    Modal,
    TextInput,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment-timezone";
import { useTimeZone } from "../../context/TimeZoneContext";
import { useTheme } from "../../context/ThemeContext";
import { SPACING, FONT_SIZES } from "../../constants";

const TimeZoneSection = () => {
    // Time Zone context and state
    const timeZoneContext = useTimeZone();
    const { colors } = useTheme();
    const [timeZoneModalVisible, setTimeZoneModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredTimeZones, setFilteredTimeZones] = useState([]);
    const [momentInitialized, setMomentInitialized] = useState(false);

    // Ensure moment.js is properly initialized
    useEffect(() => {
        // Check if moment.tz is available
        if (moment && moment.tz) {
            setMomentInitialized(true);
        } else {
            console.error("moment-timezone is not properly initialized");
            setMomentInitialized(false);
        }
    }, []);

    // Handle time zone search
    const handleTimeZoneSearch = (text) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredTimeZones([]);
            return;
        }

        // Get all time zones and filter based on search
        if (
            momentInitialized &&
            moment.tz &&
            typeof moment.tz.names === "function"
        ) {
            const allTimeZones = moment.tz.names();
            const filtered = allTimeZones.filter((tz) =>
                tz.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredTimeZones(filtered);
        } else {
            // If moment.tz.names is not available, set empty array
            console.warn("moment-timezone names function is not available");
            setFilteredTimeZones([]);
        }
    };

    const { timeZoneSettings, updateTimeZoneSettings, getCurrentTimeZone } =
        timeZoneContext;
    const currentTimeZone = getCurrentTimeZone();

    return (
        <View
            style={[styles.settingSection, { backgroundColor: colors.surface }]}
        >
            <Text style={[styles.settingTitle, { color: colors.text }]}>
                Time Zone Settings
            </Text>
            <Text
                style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                ]}
            >
                Configure how dates and times are displayed in the app
            </Text>

            <View style={styles.timeZoneContainer}>
                <View style={styles.timeZoneRow}>
                    <Text
                        style={[styles.timeZoneLabel, { color: colors.text }]}
                    >
                        Use Device Time Zone:
                    </Text>
                    <Switch
                        value={timeZoneSettings.useDeviceTimeZone}
                        onValueChange={(value) => {
                            updateTimeZoneSettings({
                                useDeviceTimeZone: value,
                            });
                        }}
                        trackColor={{
                            false: colors.border,
                            true: colors.primary,
                        }}
                        thumbColor={colors.background}
                    />
                </View>

                <View style={styles.timeZoneRow}>
                    <Text
                        style={[styles.timeZoneLabel, { color: colors.text }]}
                    >
                        Current Time Zone:
                    </Text>
                    <Text
                        style={[
                            styles.timeZoneValue,
                            { color: colors.primary },
                        ]}
                    >
                        {currentTimeZone}
                    </Text>
                </View>

                <View style={styles.timeZoneRow}>
                    <Text
                        style={[styles.timeZoneLabel, { color: colors.text }]}
                    >
                        Current Time:
                    </Text>
                    <Text
                        style={[
                            styles.timeZoneValue,
                            { color: colors.primary },
                        ]}
                    >
                        {currentTimeZone && momentInitialized && moment.tz
                            ? moment()
                                  .tz(currentTimeZone)
                                  .format("MMM D, YYYY h:mm A z")
                            : moment().format("MMM D, YYYY h:mm A")}
                    </Text>
                </View>

                {!timeZoneSettings.useDeviceTimeZone && (
                    <TouchableOpacity
                        style={[
                            styles.selectTimeZoneButton,
                            { backgroundColor: colors.primary },
                        ]}
                        onPress={() => setTimeZoneModalVisible(true)}
                    >
                        <Ionicons
                            name="globe-outline"
                            size={18}
                            color={colors.background}
                        />
                        <Text
                            style={[
                                styles.selectTimeZoneButtonText,
                                { color: colors.background },
                            ]}
                        >
                            Select Time Zone
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Time Zone Selection Modal */}
            <Modal
                visible={timeZoneModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setTimeZoneModalVisible(false)}
            >
                <View
                    style={[
                        styles.modalContainer,
                        { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                    ]}
                >
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <View
                            style={[
                                styles.modalHeader,
                                { borderBottomColor: colors.border },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.modalTitle,
                                    { color: colors.text },
                                ]}
                            >
                                Select Time Zone
                            </Text>
                            <TouchableOpacity
                                onPress={() => setTimeZoneModalVisible(false)}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={colors.text}
                                />
                            </TouchableOpacity>
                        </View>

                        <View
                            style={[
                                styles.searchContainer,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Ionicons
                                name="search"
                                size={20}
                                color={colors.textSecondary}
                            />
                            <TextInput
                                style={[
                                    styles.searchInput,
                                    { color: colors.text },
                                ]}
                                placeholder="Search time zones..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={handleTimeZoneSearch}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchQuery("");
                                        setFilteredTimeZones([]);
                                    }}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <FlatList
                            data={
                                searchQuery
                                    ? filteredTimeZones
                                    : momentInitialized &&
                                      moment.tz &&
                                      typeof moment.tz.names === "function"
                                    ? moment.tz.names()
                                    : []
                            }
                            keyExtractor={(item) => item || ""}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.timeZoneItem,
                                        timeZoneSettings.selectedTimeZone ===
                                            item && [
                                            styles.timeZoneItemSelected,
                                            {
                                                backgroundColor:
                                                    colors.primary + "20",
                                            },
                                        ],
                                    ]}
                                    onPress={() => {
                                        updateTimeZoneSettings({
                                            selectedTimeZone: item,
                                            useDeviceTimeZone: false,
                                        });
                                        setTimeZoneModalVisible(false);
                                        setSearchQuery("");
                                        setFilteredTimeZones([]);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.timeZoneItemText,
                                            { color: colors.text },
                                            timeZoneSettings.selectedTimeZone ===
                                                item && [
                                                styles.timeZoneItemTextSelected,
                                                { color: colors.primary },
                                            ],
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.timeZoneItemOffset,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {momentInitialized && moment.tz && item
                                            ? moment.tz(item).format("Z")
                                            : ""}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => (
                                <View
                                    style={[
                                        styles.separator,
                                        { backgroundColor: colors.border },
                                    ]}
                                />
                            )}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {searchQuery
                                            ? "No time zones found"
                                            : "Loading time zones..."}
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    settingSection: {
        marginBottom: SPACING.xl,
        borderRadius: 8,
        padding: SPACING.md,
    },
    settingTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        marginBottom: SPACING.xs,
    },
    settingDescription: {
        fontSize: FONT_SIZES.sm,
        marginBottom: SPACING.md,
    },
    timeZoneContainer: {
        marginTop: SPACING.md,
    },
    timeZoneRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    timeZoneLabel: {
        fontSize: FONT_SIZES.md,
        flex: 1,
    },
    timeZoneValue: {
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        flex: 1,
        textAlign: "right",
    },
    selectTimeZoneButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        marginTop: SPACING.sm,
    },
    selectTimeZoneButtonText: {
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        marginLeft: SPACING.xs,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "90%",
        height: "80%",
        borderRadius: 12,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: SPACING.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        margin: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        marginLeft: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    timeZoneItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    timeZoneItemSelected: {
        // Background color is applied dynamically
    },
    timeZoneItemText: {
        fontSize: FONT_SIZES.md,
        flex: 1,
    },
    timeZoneItemTextSelected: {
        fontWeight: "600",
    },
    timeZoneItemOffset: {
        fontSize: FONT_SIZES.sm,
        marginLeft: SPACING.sm,
    },
    separator: {
        height: 1,
        marginHorizontal: SPACING.md,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: "center",
    },
    emptyText: {
        fontSize: FONT_SIZES.md,
        textAlign: "center",
    },
});

export default TimeZoneSection;
