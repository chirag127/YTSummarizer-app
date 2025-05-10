import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SummaryScreen from "../src/screens/SummaryScreen";
import { generateSummary, getVideoSummaries } from "../src/services/api";
import { useTimeZone } from "../src/context/TimeZoneContext";

// Mock the navigation and route
const mockNavigation = {
    setOptions: jest.fn(),
    setParams: jest.fn(),
    navigate: jest.fn(),
};

const mockRoute = {
    params: {
        summary: {
            id: "123",
            video_url: "https://www.youtube.com/watch?v=abc123",
            video_title: "Test Video",
            video_thumbnail_url: "https://example.com/thumbnail.jpg",
            summary_text: "This is a test summary.",
            summary_type: "Brief",
            summary_length: "Medium",
            created_at: "2023-01-01T00:00:00.000Z",
            is_starred: false,
        },
    },
};

// Mock the API functions
jest.mock("../src/services/api", () => ({
    generateSummary: jest.fn(),
    getVideoSummaries: jest.fn(),
    regenerateSummary: jest.fn(),
    toggleStarSummary: jest.fn(),
}));

// Mock the TimeZone context
jest.mock("../src/context/TimeZoneContext", () => ({
    useTimeZone: jest.fn(),
}));

// Mock the TTS functions
jest.mock("../src/services/tts", () => ({
    speakText: jest.fn(),
    stopSpeaking: jest.fn(),
    isSpeaking: jest.fn().mockResolvedValue(false),
    setSpeechCallbacks: jest.fn(),
    clearSpeechCallbacks: jest.fn(),
    processTextForSpeech: jest.fn().mockReturnValue({
        sentences: ["This is a test sentence."],
    }),
}));

describe("SummaryScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock implementations
        useTimeZone.mockReturnValue({
            getCurrentTimeZone: jest.fn().mockReturnValue("UTC"),
            formatDateWithTimeZone: jest.fn((date) => date),
        });

        generateSummary.mockResolvedValue({
            id: "456",
            video_url: "https://www.youtube.com/watch?v=abc123",
            video_title: "Test Video",
            video_thumbnail_url: "https://example.com/thumbnail.jpg",
            summary_text: "This is a new test summary.",
            summary_type: "Detailed",
            summary_length: "Long",
            created_at: "2023-01-02T00:00:00.000Z",
            is_starred: false,
        });

        getVideoSummaries.mockResolvedValue({
            summaries: [
                {
                    id: "123",
                    video_url: "https://www.youtube.com/watch?v=abc123",
                    video_title: "Test Video",
                    video_thumbnail_url: "https://example.com/thumbnail.jpg",
                    summary_text: "This is a test summary.",
                    summary_type: "Brief",
                    summary_length: "Medium",
                    created_at: "2023-01-01T00:00:00.000Z",
                    is_starred: false,
                },
            ],
        });
    });

    test("New Type button should open the modal", async () => {
        const { getByText, queryByText } = render(
            <SummaryScreen route={mockRoute} navigation={mockNavigation} />
        );

        // Initially, the modal should not be visible
        expect(queryByText("Create New Summary")).toBeNull();

        // Click the New Type button
        fireEvent.press(getByText("New Type"));

        // The modal should now be visible
        expect(getByText("Create New Summary")).toBeTruthy();
    });

    test("Creating a new summary should show loading state and close modal after completion", async () => {
        const { getByText, queryByText } = render(
            <SummaryScreen route={mockRoute} navigation={mockNavigation} />
        );

        // Open the modal
        fireEvent.press(getByText("New Type"));

        // Select a different summary type and length
        fireEvent.press(getByText("Detailed"));
        fireEvent.press(getByText("Long"));

        // Click the Create button
        fireEvent.press(getByText("Create"));

        // The modal should show loading state
        await waitFor(() => {
            expect(getByText(/Generating summary/)).toBeTruthy();
        });

        // After the summary is generated, the modal should be closed
        await waitFor(
            () => {
                expect(queryByText("Create New Summary")).toBeNull();
            },
            { timeout: 3000 }
        ); // Increase timeout to ensure we wait long enough

        // The navigation params should be updated with the new summary
        expect(mockNavigation.setParams).toHaveBeenCalledWith({
            summary: expect.objectContaining({
                summary_type: "Detailed",
                summary_length: "Long",
            }),
        });
    });

    test("Cancelling summary generation should close the modal", async () => {
        const { getByText, queryByText } = render(
            <SummaryScreen route={mockRoute} navigation={mockNavigation} />
        );

        // Mock the generateSummary function to delay
        generateSummary.mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        id: "456",
                        video_url: "https://www.youtube.com/watch?v=abc123",
                        video_title: "Test Video",
                        summary_type: "Detailed",
                        summary_length: "Long",
                    });
                }, 1000);
            });
        });

        // Open the modal
        fireEvent.press(getByText("New Type"));

        // Select a different summary type and length
        fireEvent.press(getByText("Detailed"));
        fireEvent.press(getByText("Long"));

        // Click the Create button
        fireEvent.press(getByText("Create"));

        // The modal should show loading state
        await waitFor(() => {
            expect(getByText(/Generating summary/)).toBeTruthy();
        });

        // Click the Cancel button
        fireEvent.press(getByText("Cancel"));

        // The modal should be closed
        expect(queryByText("Create New Summary")).toBeNull();

        // The generateSummary function should have been called
        expect(generateSummary).toHaveBeenCalled();
    });
});
