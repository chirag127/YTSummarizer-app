import { Platform } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * Markdown styles for rendering AI responses
 */
const markdownStyles = {
  body: {
    color: COLORS.text,
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
    color: COLORS.text,
    flexWrap: "wrap",
  },
  heading2: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: COLORS.text,
    flexWrap: "wrap",
  },
  heading3: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
    color: COLORS.text,
    flexWrap: "wrap",
  },
  paragraph: {
    marginBottom: 8,
    color: COLORS.text,
    flexWrap: "wrap",
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: "underline",
    flexWrap: "wrap",
    overflow: "hidden",
  },
  url: {
    color: COLORS.primary,
    textDecorationLine: "underline",
    flexWrap: "wrap",
    overflow: "hidden",
  },
  code_inline: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: COLORS.border + "40",
    borderRadius: 4,
    paddingHorizontal: 4,
    flexWrap: "wrap",
    overflow: "hidden",
  },
  code_block: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: COLORS.border + "40",
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
    flexWrap: "wrap",
    width: "100%",
    overflow: "hidden",
  },
  fence: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: COLORS.border + "40",
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
    flexWrap: "wrap",
    width: "100%",
    overflow: "hidden",
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
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
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginVertical: 12,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  th: {
    padding: 8,
    fontWeight: "bold",
    backgroundColor: COLORS.surface,
  },
  td: {
    padding: 8,
  },
};

export default markdownStyles;
