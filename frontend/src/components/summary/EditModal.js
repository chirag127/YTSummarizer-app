import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import {
    SPACING,
    FONT_SIZES,
    SUMMARY_TYPES,
    SUMMARY_LENGTHS,
} from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * EditModal component displays a modal for creating a new summary type
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {string} props.selectedType - The currently selected summary type
 * @param {string} props.selectedLength - The currently selected summary length
 * @param {boolean} props.isLoading - Whether a summary is being generated
 * @param {number} props.elapsedTime - The elapsed time in seconds
 * @param {Function} props.onClose - Function to handle closing the modal
 * @param {Function} props.onSave - Function to handle saving the new summary type
 * @param {Function} props.onCancel - Function to handle canceling the generation
 * @param {Function} props.onTypeChange - Function to handle changing the summary type
 * @param {Function} props.onLengthChange - Function to handle changing the summary length
 */
const EditModal = ({
    visible,
    selectedType,
    selectedLength,
    isLoading,
    elapsedTime,
    onClose,
    onSave,
    onCancel,
    onTypeChange,
    onLengthChange,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
        },
        modalContent: {
            backgroundColor: colors.background,
            borderRadius: 8,
            padding: SPACING.lg,
            width: "80%",
            maxWidth: 400,
        },
        modalTitle: {
            fontSize: FONT_SIZES.xl,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: SPACING.lg,
            textAlign: "center",
        },
        modalLabel: {
            fontSize: FONT_SIZES.md,
            fontWeight: "500",
            color: colors.text,
            marginBottom: SPACING.sm,
        },
        optionsButtonGroup: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: SPACING.lg,
        },
        optionButton: {
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: SPACING.sm,
            marginBottom: SPACING.sm,
            backgroundColor: colors.surface,
        },
        optionButtonSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        optionButtonText: {
            fontSize: FONT_SIZES.sm,
            color: colors.text,
        },
        optionButtonTextSelected: {
            color: colors.background,
        },
        modalButtonsContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: SPACING.md,
        },
        modalCancelButton: {
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            flex: 1,
            marginRight: SPACING.sm,
            alignItems: "center",
        },
        modalCancelButtonText: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
        },
        modalSaveButton: {
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 4,
            backgroundColor: colors.primary,
            flex: 1,
            marginLeft: SPACING.sm,
            alignItems: "center",
        },
        modalSaveButtonText: {
            fontSize: FONT_SIZES.md,
            color: colors.background,
            fontWeight: "500",
        },
        loadingContainer: {
            alignItems: "center",
            padding: SPACING.md,
        },
        loadingText: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
            marginTop: SPACING.md,
            marginBottom: SPACING.md,
        },
        cancelButton: {
            flexDirection: "row",
            alignItems: "center",
            padding: SPACING.sm,
            borderRadius: 4,
            backgroundColor: colors.surface,
        },
        cancelButtonText: {
            fontSize: FONT_SIZES.sm,
            color: colors.error,
            marginLeft: 4,
        },
    }));
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create New Summary</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                            />
                            <Text style={styles.loadingText}>
                                Generating summary... {elapsedTime}s
                            </Text>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    onCancel();
                                    // Close the modal when the user cancels the generation
                                    onClose();
                                }}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color={colors.error}
                                />
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.modalLabel}>Summary Type:</Text>
                            <View style={styles.optionsButtonGroup}>
                                {SUMMARY_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[
                                            styles.optionButton,
                                            selectedType === type.id &&
                                                styles.optionButtonSelected,
                                        ]}
                                        onPress={() => onTypeChange(type.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                selectedType === type.id &&
                                                    styles.optionButtonTextSelected,
                                            ]}
                                        >
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.modalLabel}>
                                Summary Length:
                            </Text>
                            <View style={styles.optionsButtonGroup}>
                                {SUMMARY_LENGTHS.map((length) => (
                                    <TouchableOpacity
                                        key={length.id}
                                        style={[
                                            styles.optionButton,
                                            selectedLength === length.id &&
                                                styles.optionButtonSelected,
                                        ]}
                                        onPress={() =>
                                            onLengthChange(length.id)
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                selectedLength === length.id &&
                                                    styles.optionButtonTextSelected,
                                            ]}
                                        >
                                            {length.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.modalCancelButtonText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalSaveButton}
                                    onPress={onSave}
                                >
                                    <Text style={styles.modalSaveButtonText}>
                                        Generate
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

EditModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    selectedType: PropTypes.string.isRequired,
    selectedLength: PropTypes.string.isRequired,
    isLoading: PropTypes.bool.isRequired,
    elapsedTime: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onTypeChange: PropTypes.func.isRequired,
    onLengthChange: PropTypes.func.isRequired,
};

export default EditModal;
