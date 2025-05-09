"""
Retrieval Augmented Generation (RAG) module for handling long transcripts.

This module provides functions to:
1. Chunk transcripts into smaller segments
2. Create embeddings for each chunk
3. Perform similarity search between user questions and transcript chunks
4. Select the most relevant chunks for the model
"""

import re
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sentence_transformers import SentenceTransformer
import token_management

# Configure logging
logger = logging.getLogger(__name__)

# Default chunk size and overlap
DEFAULT_CHUNK_SIZE = 500  # words
DEFAULT_CHUNK_OVERLAP = 100  # words
DEFAULT_TOP_K_CHUNKS = 5  # number of chunks to retrieve

# Initialize the embedding model
# Using a smaller model for efficiency, can be replaced with a larger one for better quality
embedding_model = None

def initialize_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
    """
    Initialize the embedding model.
    
    Args:
        model_name: Name of the sentence-transformers model to use
        
    Returns:
        True if initialization was successful, False otherwise
    """
    global embedding_model
    try:
        if embedding_model is None:
            logger.info(f"Initializing embedding model: {model_name}")
            embedding_model = SentenceTransformer(model_name)
        return True
    except Exception as e:
        logger.error(f"Error initializing embedding model: {e}")
        return False

def chunk_transcript(transcript: str, chunk_size: int = DEFAULT_CHUNK_SIZE, chunk_overlap: int = DEFAULT_CHUNK_OVERLAP) -> List[str]:
    """
    Split transcript into overlapping chunks.
    
    Args:
        transcript: The full transcript text
        chunk_size: Size of each chunk in words
        chunk_overlap: Overlap between chunks in words
        
    Returns:
        List of transcript chunks
    """
    if not transcript:
        return []
    
    # Split transcript into words
    words = transcript.split()
    
    # If transcript is smaller than chunk size, return it as a single chunk
    if len(words) <= chunk_size:
        return [transcript]
    
    chunks = []
    start = 0
    
    while start < len(words):
        # Calculate end position
        end = min(start + chunk_size, len(words))
        
        # Create chunk from words
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        
        # Move start position for next chunk (with overlap)
        start = start + chunk_size - chunk_overlap
    
    logger.info(f"Split transcript into {len(chunks)} chunks (avg {sum(len(c.split()) for c in chunks) / len(chunks):.1f} words per chunk)")
    return chunks

def create_embeddings(chunks: List[str]) -> Optional[np.ndarray]:
    """
    Create embeddings for transcript chunks.
    
    Args:
        chunks: List of transcript chunks
        
    Returns:
        Numpy array of embeddings or None if embedding fails
    """
    if not chunks:
        return None
    
    # Initialize embedding model if not already initialized
    if not initialize_embedding_model():
        logger.error("Failed to initialize embedding model")
        return None
    
    try:
        # Create embeddings
        embeddings = embedding_model.encode(chunks)
        logger.info(f"Created embeddings for {len(chunks)} chunks with shape {embeddings.shape}")
        return embeddings
    except Exception as e:
        logger.error(f"Error creating embeddings: {e}")
        return None

def search_relevant_chunks(question: str, chunks: List[str], chunk_embeddings: np.ndarray, top_k: int = DEFAULT_TOP_K_CHUNKS) -> List[Tuple[str, float]]:
    """
    Find the most relevant chunks for a question.
    
    Args:
        question: User's question
        chunks: List of transcript chunks
        chunk_embeddings: Embeddings for the chunks
        top_k: Number of top chunks to return
        
    Returns:
        List of (chunk, score) tuples sorted by relevance
    """
    if not chunks or chunk_embeddings is None:
        return []
    
    # Initialize embedding model if not already initialized
    if not initialize_embedding_model():
        logger.error("Failed to initialize embedding model")
        return []
    
    try:
        # Create embedding for the question
        question_embedding = embedding_model.encode([question])[0]
        
        # Calculate cosine similarity between question and all chunks
        similarities = np.dot(chunk_embeddings, question_embedding) / (
            np.linalg.norm(chunk_embeddings, axis=1) * np.linalg.norm(question_embedding)
        )
        
        # Get indices of top_k most similar chunks
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        # Return top chunks with their similarity scores
        results = [(chunks[i], float(similarities[i])) for i in top_indices]
        
        logger.info(f"Found {len(results)} relevant chunks for question: {question[:50]}...")
        return results
    except Exception as e:
        logger.error(f"Error searching relevant chunks: {e}")
        return []

def prepare_rag_context(transcript: str, question: str, history: List[Dict[str, Any]] = None) -> str:
    """
    Prepare RAG context by selecting relevant chunks from the transcript.
    
    Args:
        transcript: The full transcript text
        question: User's question
        history: Optional conversation history
        
    Returns:
        Selected transcript chunks combined into a context string
    """
    # Count tokens in the transcript
    transcript_tokens = token_management.count_tokens(transcript)
    logger.info(f"Transcript length: {transcript_tokens} tokens")
    
    # If transcript is within token limits, return it as is
    if transcript_tokens <= token_management.MAX_TRANSCRIPT_TOKENS:
        logger.info("Transcript is within token limits, skipping RAG")
        return transcript
    
    # Split transcript into chunks
    chunks = chunk_transcript(transcript)
    
    # Create embeddings for chunks
    chunk_embeddings = create_embeddings(chunks)
    if chunk_embeddings is None:
        logger.warning("Failed to create embeddings, falling back to truncation")
        return token_management.truncate_transcript(transcript)
    
    # Prepare search query
    search_query = question
    if history:
        # Include the last few turns of conversation for context
        last_turns = history[-2:] if len(history) > 2 else history
        context_parts = [msg["content"] for msg in last_turns]
        context_parts.append(question)
        search_query = " ".join(context_parts)
    
    # Search for relevant chunks
    relevant_chunks = search_relevant_chunks(search_query, chunks, chunk_embeddings)
    if not relevant_chunks:
        logger.warning("No relevant chunks found, falling back to truncation")
        return token_management.truncate_transcript(transcript)
    
    # Combine relevant chunks into a context string
    context_parts = []
    total_tokens = 0
    
    # Add chunks in order of relevance until we reach the token limit
    for chunk, score in relevant_chunks:
        chunk_tokens = token_management.count_tokens(chunk)
        if total_tokens + chunk_tokens <= token_management.MAX_TRANSCRIPT_TOKENS:
            context_parts.append(f"[Relevance: {score:.2f}] {chunk}")
            total_tokens += chunk_tokens
        else:
            break
    
    context = "\n\n".join(context_parts)
    logger.info(f"Created RAG context with {total_tokens} tokens from {len(context_parts)} chunks")
    
    return context

def should_use_rag(transcript: str) -> bool:
    """
    Determine if RAG should be used for a transcript.
    
    Args:
        transcript: The full transcript text
        
    Returns:
        True if RAG should be used, False otherwise
    """
    if not transcript:
        return False
    
    # Count tokens in the transcript
    transcript_tokens = token_management.count_tokens(transcript)
    
    # Use RAG if transcript exceeds the token limit
    should_use = transcript_tokens > token_management.MAX_TRANSCRIPT_TOKENS
    if should_use:
        logger.info(f"Transcript exceeds token limit ({transcript_tokens} > {token_management.MAX_TRANSCRIPT_TOKENS}), will use RAG")
    
    return should_use
