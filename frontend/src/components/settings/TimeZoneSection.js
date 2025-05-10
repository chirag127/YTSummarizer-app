import React, { useState } from "react";
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
import { COLORS, SPACING, FONT_SIZES } from "../../constants";

const TimeZoneSection = () => {
    // Time Zone context and state
    const timeZoneContext = useTimeZone();
    const [timeZoneModalVisible, setTimeZoneModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredTimeZones, setFilteredTimeZones] = useState([]);

    // Handle time zone search
    const handleTimeZoneSearch = (text) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredTimeZones([]);
            return;
        }

        // Get all time zones and filter based on search
        const allTimeZones = moment.tz.names();
        const filtered = allTimeZones.filter((tz) =>
            tz.toLowerCase().includes(text.toLowerCase())
        );

        setFilteredTimeZones(filtered);
    };

    const { timeZoneSettings, updateTimeZoneSettings, getCurrentTimeZone } =
        timeZoneContext;
    const currentTimeZone = getCurrentTimeZone();

    return (
        <View style={styles.settingSection}>
            <Text style={styles.settingTitle}>Time Zone Settings</Text>
            <Text style={styles.settingDescription}>
                Configure how dates and times are displayed in the app
            </Text>

            <View style={styles.timeZoneContainer}>
                <View style={styles.timeZoneRow}>
                    <Text style={styles.timeZoneLabel}>
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
                            false: COLORS.border,
                            true: COLORS.primary,
                        }}
                        thumbColor={COLORS.background}
                    />
                </View>

                <View style={styles.timeZoneRow}>
                    <Text style={styles.timeZoneLabel}>
                        Current Time Zone:
                    </Text>
                    <Text style={styles.timeZoneValue}>
                        {currentTimeZone}
                    </Text>
                </View>

                <View style={styles.timeZoneRow}>
                    <Text style={styles.timeZoneLabel}>Current Time:</Text>
                    <Text style={styles.timeZoneValue}>
                        {moment()
                            .tz(currentTimeZone)
                            .format("MMM D, YYYY h:mm A z")}
                    </Text>
                </View>

                {!timeZoneSettings.useDeviceTimeZone && (
                    <TouchableOpacity
                        style={styles.selectTimeZoneButton}
                        onPress={() => setTimeZoneModalVisible(true)}
                    >
                        <Ionicons
                            name="globe-outline"
                            size={18}
                            color={COLORS.background}
                        />
                        <Text style={styles.selectTimeZoneButtonText}>
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
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Select Time Zone
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setTimeZoneModalVisible(false)
                                }
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={COLORS.text}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search time zones..."
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
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <FlatList
                            data={
                                searchQuery
                                    ? filteredTimeZones
                                    : moment.tz.names()
                            }
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.timeZoneItem,
                                        timeZoneSettings.selectedTimeZone ===
                                            item &&
                                            styles.timeZoneItemSelected,
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
                                            timeZoneSettings.selectedTimeZone ===
                                                item &&
                                                styles.timeZoneItemTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    <Text style={styles.timeZoneItemOffset}>
                                        {moment.tz(item).format("Z")}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => (
                                <View style={styles.separator} />
                            )}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>
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
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: SPACING.md,
    },
    settingTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    settingDescription: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
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
        color: COLORS.text,
        flex: 1,
    },
    timeZoneValue: {
        fontSize: FONT_SIZES.md,
        color: COLORS.primary,
        fontWeight: "500",
        flex: 1,
        textAlign: "right",
    },
    selectTimeZoneButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        marginTop: SPACING.sm,
    },
    selectTimeZoneButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        marginLeft: SPACING.xs,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "90%",
        height: "80%",
        backgroundColor: COLORS.background,
        borderRadius: 12,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        color: COLORS.text,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        margin: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
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
        backgroundColor: COLORS.primary + "20", // Add transparency
    },
    timeZoneItemText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        flex: 1,
    },
    timeZoneItemTextSelected: {
        fontWeight: "600",
        color: COLORS.primary,
    },
    timeZoneItemOffset: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginLeft: SPACING.sm,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.md,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: "center",
    },
    emptyText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
});

export default TimeZoneSection;
