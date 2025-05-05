"""
Test script for RAG module.

This script tests the RAG functionality to ensure it correctly
handles long transcripts and retrieves relevant chunks.
"""

import asyncio
import logging
import rag
import token_management

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_rag():
    """Test RAG functionality."""

    # Test transcript chunking
    logger.info("Testing transcript chunking...")

    # Create a test transcript
    transcript = """
    Welcome to this video about artificial intelligence. Today, we're going to discuss the history,
    current applications, and future of AI. Let's start with a brief history.

    AI research began in the 1950s. The term "artificial intelligence" was coined at the Dartmouth Conference in 1956.
    Early AI focused on symbolic methods and rule-based systems. These systems could solve specific problems but lacked
    the ability to learn from data or adapt to new situations.

    In the 1980s, machine learning began to gain popularity. This approach allowed computers to learn from data rather
    than following explicit programming. However, these early machine learning systems were limited by computational
    power and available data.

    The 2010s saw the rise of deep learning, a subset of machine learning based on artificial neural networks.
    Deep learning has led to breakthroughs in computer vision, natural language processing, and reinforcement learning.

    Now, let's talk about current applications of AI. AI is being used in healthcare to diagnose diseases,
    predict patient outcomes, and discover new drugs. In finance, AI algorithms trade stocks, detect fraud,
    and assess credit risk. In transportation, AI powers self-driving cars and optimizes logistics.

    The future of AI holds both promise and challenges. AI could help solve global problems like climate change,
    disease, and poverty. However, it also raises concerns about privacy, bias, job displacement, and safety.

    In conclusion, AI has come a long way since its inception and continues to transform our world.
    Thanks for watching this video. If you have any questions, please leave them in the comments below.
    """

    # Test chunking
    chunks = rag.chunk_transcript(transcript, chunk_size=50, chunk_overlap=10)
    logger.info(f"Created {len(chunks)} chunks")
    for i, chunk in enumerate(chunks[:2]):
        logger.info(f"Chunk {i}: {chunk[:100]}...")

    # Test embedding creation
    logger.info("\nTesting embedding creation...")
    chunk_embeddings = rag.create_embeddings(chunks)
    if chunk_embeddings is not None:
        logger.info(f"Created embeddings with shape {chunk_embeddings.shape}")

    # Test similarity search
    logger.info("\nTesting similarity search...")
    question = "What are the applications of AI in healthcare?"
    if chunk_embeddings is not None:
        relevant_chunks = rag.search_relevant_chunks(question, chunks, chunk_embeddings, top_k=2)
        logger.info(f"Found {len(relevant_chunks)} relevant chunks")
        for i, (chunk, score) in enumerate(relevant_chunks):
            logger.info(f"Relevant chunk {i} (score: {score:.4f}): {chunk[:100]}...")

    # Test RAG context preparation
    logger.info("\nTesting RAG context preparation...")

    # Create a long transcript (approximately 1 million tokens)
    long_transcript = transcript * 1000

    # Count tokens in the original transcript
    original_tokens = token_management.count_tokens(long_transcript)
    logger.info(f"Original transcript: {original_tokens} tokens")

    # Temporarily lower the MAX_TRANSCRIPT_TOKENS to force RAG to be used
    original_max_tokens = token_management.MAX_TRANSCRIPT_TOKENS
    token_management.MAX_TRANSCRIPT_TOKENS = 100000  # Set to a lower value to trigger RAG

    try:
        # Check if RAG should be used
        should_use_rag = rag.should_use_rag(long_transcript)
        logger.info(f"Should use RAG: {should_use_rag}")

        # Prepare RAG context
        rag_context = rag.prepare_rag_context(long_transcript, question)

        # Count tokens in the RAG context
        rag_tokens = token_management.count_tokens(rag_context)
        logger.info(f"RAG context: {rag_tokens} tokens")
        logger.info(f"Reduction: {original_tokens - rag_tokens} tokens ({(1 - rag_tokens/original_tokens)*100:.2f}%)")

        # Verify RAG context is within token limits
        assert rag_tokens <= token_management.MAX_TRANSCRIPT_TOKENS, "RAG context exceeds token limit"

        # Verify that RAG actually reduced the token count
        assert rag_tokens < original_tokens, "RAG did not reduce token count"
    finally:
        # Restore the original MAX_TRANSCRIPT_TOKENS
        token_management.MAX_TRANSCRIPT_TOKENS = original_max_tokens

    logger.info("All RAG tests passed!")

if __name__ == "__main__":
    asyncio.run(test_rag())
