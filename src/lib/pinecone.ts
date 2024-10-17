import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not set in the environment variables');
}

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const indexName = "quest-rag";

export async function initializePineconeIndex() {
  try {
    await pc.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      spec: { 
        serverless: { 
          cloud: 'aws', 
          region: 'us-east-1' 
        }
      } 
    });
    console.log(`Index ${indexName} created successfully`);
  } catch (error) {
    // If the index already exists, this will throw an error
    console.error('Error creating index:', error);
  }
}

export default pc;