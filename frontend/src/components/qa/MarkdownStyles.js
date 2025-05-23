import { Platform } from "react-native";
import { SPACING, FONT_SIZES } from "../../constants";

/**
 * Function to get markdown styles with theme colors
 *
 * @param {Object} colors - Theme colors object
 * @returns {Object} Markdown styles object with theme colors applied
 */
const getMarkdownStyles = (colors) => ({
    body: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 20,
        flexWrap: "wrap",
        flexShrink: 1,
        width: "100%",
    },
    heading1: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 8,
        color: colors.text,
        flexWrap: "wrap",
    },
    heading2: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 8,
        color: colors.text,
        flexWrap: "wrap",
    },
    heading3: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 8,
        marginBottom: 4,
        color: colors.text,
        flexWrap: "wrap",
    },
    paragraph: {
        marginBottom: 8,
        color: colors.text,
        flexWrap: "wrap",
    },
    link: {
        color: colors.primary,
        textDecorationLine: "underline",
        flexWrap: "wrap",
        overflow: "hidden",
    },
    url: {
        color: colors.primary,
        textDecorationLine: "underline",
        flexWrap: "wrap",
        overflow: "hidden",
    },
    code_inline: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: `${colors.border}40`,
        borderRadius: 4,
        paddingHorizontal: 4,
        flexWrap: "wrap",
        overflow: "hidden",
    },
    code_block: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: `${colors.border}40`,
        borderRadius: 4,
        padding: 8,
        marginVertical: 8,
        flexWrap: "wrap",
        width: "100%",
        overflow: "hidden",
    },
    fence: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: `${colors.border}40`,
        borderRadius: 4,
        padding: 8,
        marginVertical: 8,
        flexWrap: "wrap",
        width: "100%",
        overflow: "hidden",
    },
    blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: colors.border,
        paddingLeft: 12,
        flexWrap: "wrap",
        marginLeft: 8,
        marginVertical: 8,
        opacity: 0.8,
    },
    list_item: {
        flexDirection: "row",
        marginBottom: 4,
    },
    bullet_list: {
        marginBottom: 8,
    },
    ordered_list: {
        marginBottom: 8,
    },
    hr: {
        backgroundColor: colors.border,
        height: 1,
        marginVertical: 12,
    },
    table: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        marginVertical: 12,
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    th: {
        padding: 8,
        fontWeight: "bold",
        backgroundColor: colors.surface,
    },
    td: {
        padding: 8,
    },
});

export default getMarkdownStyles;
