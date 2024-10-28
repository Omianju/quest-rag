import { GoogleGenerativeAI } from '@google/generative-ai';

// Check for API Key availability
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Function to embed a single text string
export const embedText = async (text: string): Promise<number[]> => {
  try {
    const model = googleAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);

    // Ensure result.embedding.values is an array of numbers
    if (Array.isArray(result.embedding?.values)) {
      return result.embedding.values;
    } else {
      throw new Error('Embedding result is not in the expected format');
    }
  } catch (error) {
    console.error('Error embedding text:', error);
    throw error;
  }
};

// Create an EmbeddingsInterface-compliant object
export const embeddings = {
  // Method to handle multiple documents (array of strings)
  embedDocuments: async (documents: string[]): Promise<number[][]> => {
    const embeddingsArray = await Promise.all(
      documents.map(async (doc) => embedText(doc))
    );
    return embeddingsArray;  // Return an array of arrays of numbers
  },

  // Method to handle a single query (a single string)
  embedQuery: async (query: string): Promise<number[]> => {
    return embedText(query);
  },
};
