import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import moment from "moment-timezone";

// Storage key for time zone settings
const TIME_ZONE_SETTINGS_KEY = "time_zone_settings";

// Create the context
const TimeZoneContext = createContext();

// Custom hook to use the time zone context
export const useTimeZone = () => useContext(TimeZoneContext);

// Provider component
export const TimeZoneProvider = ({ children }) => {
    // State for time zone settings
    const [timeZoneSettings, setTimeZoneSettings] = useState({
        useDeviceTimeZone: true, // Default to using device time zone
        selectedTimeZone: Localization.timezone, // Default to device time zone
    });

    // State for available time zones
    const [availableTimeZones, setAvailableTimeZones] = useState([]);

    // Load time zone settings from storage
    useEffect(() => {
        const loadTimeZoneSettings = async () => {
            try {
                const storedSettings = await AsyncStorage.getItem(
                    TIME_ZONE_SETTINGS_KEY
                );
                if (storedSettings) {
                    setTimeZoneSettings(JSON.parse(storedSettings));
                }
            } catch (error) {
                console.error("Error loading time zone settings:", error);
            }
        };

        // Get available time zones
        const timeZones = moment.tz.names();

        // Group time zones by region
        const groupedTimeZones = timeZones.reduce((acc, tz) => {
            const region = tz.split("/")[0];
            if (!acc[region]) {
                acc[region] = [];
            }
            acc[region].push(tz);
            return acc;
        }, {});

        setAvailableTimeZones(groupedTimeZones);

        loadTimeZoneSettings();
    }, []);

    // Save time zone settings to storage
    const saveTimeZoneSettings = async (settings) => {
        try {
            await AsyncStorage.setItem(
                TIME_ZONE_SETTINGS_KEY,
                JSON.stringify(settings)
            );
            setTimeZoneSettings(settings);
        } catch (error) {
            console.error("Error saving time zone settings:", error);
        }
    };

    // Update time zone settings
    const updateTimeZoneSettings = (settings) => {
        saveTimeZoneSettings({
            ...timeZoneSettings,
            ...settings,
        });
    };

    // Get current time zone
    const getCurrentTimeZone = () => {
        return timeZoneSettings.useDeviceTimeZone
            ? Localization.timezone
            : timeZoneSettings.selectedTimeZone;
    };

    // Format date with current time zone
    const formatDateWithTimeZone = (
        dateString,
        format = "MMM D, YYYY h:mm A"
    ) => {
        if (!dateString) return "";

        try {
            const timeZone = getCurrentTimeZone();

            // Check if moment.tz is available and we have a valid time zone
            if (moment.tz && timeZone) {
                return moment(dateString).tz(timeZone).format(format);
            }

            // Fallback to basic moment formatting without time zone
            return moment(dateString).format(format);
        } catch (error) {
            console.error("Error formatting date with time zone:", error);

            // Final fallback to native JavaScript date formatting
            try {
                return new Date(dateString).toLocaleString();
            } catch (e) {
                return "Invalid date";
            }
        }
    };

    // Convert date to current time zone
    const convertToTimeZone = (dateString) => {
        if (!dateString) return new Date();

        try {
            const timeZone = getCurrentTimeZone();

            // Check if moment.tz is available and we have a valid time zone
            if (moment.tz && timeZone) {
                return moment.tz(dateString, timeZone).toDate();
            }

            // Fallback to basic moment conversion without time zone
            return moment(dateString).toDate();
        } catch (error) {
            console.error("Error converting date to time zone:", error);

            // Final fallback to native JavaScript date
            try {
                return new Date(dateString);
            } catch (e) {
                return new Date();
            }
        }
    };

    // Context value
    const value = {
        timeZoneSettings,
        availableTimeZones,
        updateTimeZoneSettings,
        getCurrentTimeZone,
        formatDateWithTimeZone,
        convertToTimeZone,
    };

    return (
        <TimeZoneContext.Provider value={value}>
            {children}
        </TimeZoneContext.Provider>
    );
};

export default TimeZoneContext;
