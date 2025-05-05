// analytics.js - Analytics service for tracking user interactions

// Analytics event types
export const QA_EVENTS = {
    SESSION_START: "qa_session_start",
    SESSION_END: "qa_session_end",
    QUESTION_ASKED: "qa_question_asked",
    ANSWER_RECEIVED: "qa_answer_received",
    CANNOT_ANSWER: "qa_cannot_answer",
    ERROR: "qa_error",
    ANSWER_COPIED: "qa_answer_copied",
};

// In-memory analytics storage for aggregating metrics
// In a real implementation, this would be persisted to a database or analytics service
const analyticsStore = {
    sessionLengths: [], // Array of session lengths (number of turns)
    cannotAnswerCount: 0, // Count of "cannot answer" responses
    totalAnswers: 0, // Total number of answers for calculating rate
    responseTimeTotal: 0, // Total response time for calculating average
    responseTimeCount: 0, // Count of responses for calculating average
};

// Initialize analytics
export const initializeAnalytics = () => {
    // This would normally connect to an analytics service
    console.log("Analytics initialized");
};

// Track when a Q&A session starts
export const trackQASessionStart = (videoId) => {
    console.log(`Q&A session started for video: ${videoId}`);
    return {
        sessionStartTime: Date.now(),
        videoId,
        questionCount: 0, // Track number of questions in this session
    };
};

// Track when a Q&A session ends
export const trackQASessionEnd = (sessionData, messageCount) => {
    if (!sessionData) return;

    const sessionDuration = Date.now() - sessionData.sessionStartTime;
    const sessionLengthTurns = Math.floor(messageCount / 2); // Each turn is a question-answer pair

    console.log(`Q&A session ended for video: ${sessionData.videoId}`);
    console.log(`Session duration: ${sessionDuration}ms`);
    console.log(`Session length: ${sessionLengthTurns} turns`);

    // Store session length for analytics
    analyticsStore.sessionLengths.push(sessionLengthTurns);

    // Calculate and log average session length
    const avgSessionLength =
        analyticsStore.sessionLengths.length > 0
            ? analyticsStore.sessionLengths.reduce(
                  (sum, length) => sum + length,
                  0
              ) / analyticsStore.sessionLengths.length
            : 0;

    console.log(`Average session length: ${avgSessionLength.toFixed(2)} turns`);

    return {
        sessionDuration,
        sessionLengthTurns,
        videoId: sessionData.videoId,
        avgSessionLength,
    };
};

// Track when a question is asked
export const trackQuestionAsked = async (videoId, timestamp) => {
    console.log(
        `Question asked for video: ${videoId} at ${new Date(
            timestamp
        ).toISOString()}`
    );
    return {
        questionTimestamp: timestamp,
        videoId,
    };
};

// Track when an answer is received
export const trackAnswerReceived = async (videoId, questionData, answer) => {
    if (!questionData) return;

    const responseTime = Date.now() - questionData.questionTimestamp;
    console.log(`Answer received for video: ${videoId} in ${responseTime}ms`);

    // Update analytics store
    analyticsStore.totalAnswers++;
    analyticsStore.responseTimeTotal += responseTime;
    analyticsStore.responseTimeCount++;

    // Check if the answer indicates the AI couldn't answer the question
    const isCannotAnswer = detectCannotAnswer(answer);
    if (isCannotAnswer) {
        trackCannotAnswer(videoId, answer);
    }

    // Calculate and log average response time
    const avgResponseTime =
        analyticsStore.responseTimeCount > 0
            ? analyticsStore.responseTimeTotal /
              analyticsStore.responseTimeCount
            : 0;

    console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);

    return {
        responseTime,
        answerLength: answer.length,
        videoId,
        isCannotAnswer,
    };
};

// Detect if an answer indicates the AI couldn't answer the question
const detectCannotAnswer = (answer) => {
    // Common phrases that indicate the AI couldn't answer
    const cannotAnswerPhrases = [
        "not available in the video",
        "not mentioned in the transcript",
        "not discussed in the video",
        "not provided in the transcript",
        "cannot find this information",
        "doesn't mention",
        "does not mention",
        "isn't mentioned",
        "is not mentioned",
        "no information about",
        "no mention of",
        "not covered in",
        "not addressed in",
        "not included in",
        "not specified in",
        "not stated in",
        "not found in",
        "unable to find",
        "cannot determine from",
        "can't determine from",
        "cannot answer based on",
        "can't answer based on",
    ];

    // Convert answer to lowercase for case-insensitive matching
    const lowerAnswer = answer.toLowerCase();

    // Check if any of the phrases are in the answer
    return cannotAnswerPhrases.some((phrase) => lowerAnswer.includes(phrase));
};

// Track when the AI cannot answer a question
export const trackCannotAnswer = (videoId, answer) => {
    console.log(`AI could not answer question for video: ${videoId}`);

    // Update analytics store
    analyticsStore.cannotAnswerCount++;

    // Calculate and log "cannot answer" rate
    const cannotAnswerRate =
        analyticsStore.totalAnswers > 0
            ? (analyticsStore.cannotAnswerCount / analyticsStore.totalAnswers) *
              100
            : 0;

    console.log(`"Cannot answer" rate: ${cannotAnswerRate.toFixed(2)}%`);

    return {
        videoId,
        timestamp: Date.now(),
        cannotAnswerRate,
    };
};

// Track errors in the Q&A process
export const trackQAError = async (errorType) => {
    console.log(`Q&A error: ${errorType}`);
    return {
        errorType,
        timestamp: Date.now(),
    };
};

// Track when a user copies an answer
export const trackAnswerCopied = async (videoId) => {
    console.log(`Answer copied for video: ${videoId}`);
    return {
        videoId,
        timestamp: Date.now(),
    };
};

// Get analytics metrics
export const getAnalyticsMetrics = () => {
    const avgSessionLength =
        analyticsStore.sessionLengths.length > 0
            ? analyticsStore.sessionLengths.reduce(
                  (sum, length) => sum + length,
                  0
              ) / analyticsStore.sessionLengths.length
            : 0;

    const avgResponseTime =
        analyticsStore.responseTimeCount > 0
            ? analyticsStore.responseTimeTotal /
              analyticsStore.responseTimeCount
            : 0;

    const cannotAnswerRate =
        analyticsStore.totalAnswers > 0
            ? (analyticsStore.cannotAnswerCount / analyticsStore.totalAnswers) *
              100
            : 0;

    return {
        avgSessionLength,
        avgResponseTime,
        cannotAnswerRate,
        totalSessions: analyticsStore.sessionLengths.length,
        totalAnswers: analyticsStore.totalAnswers,
        cannotAnswerCount: analyticsStore.cannotAnswerCount,
    };
};

export default {
    initializeAnalytics,
    trackQASessionStart,
    trackQASessionEnd,
    trackQuestionAsked,
    trackAnswerReceived,
    trackCannotAnswer,
    trackQAError,
    trackAnswerCopied,
    getAnalyticsMetrics,
    QA_EVENTS,
};
