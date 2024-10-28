import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import pc from "@/lib/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { embeddings } from "@/lib/embedding";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse } from "ai";


export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    // Authorising after that receiving and sending message.
    const body = await req.json();
    const { getUser } = getKindeServerSession();
    const { id: userId } = await getUser();

    if (!userId) return new Response("Unauthorised", { status: 401 });

    const { fileId, message } = SendMessageValidator.parse(body);

    const file = await db.file.findUnique({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) return new Response("file not found!", { status: 403 });

    const createdMessage = await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        fileId,
        userId,
      },
    });

    // AI
    // 1. Vectorize the message

    const pineconeIndex = pc.Index("quest-rag");

    // When you use this method, it connects to the specified index, allowing you to retrieve, insert, and query vectors from that index.
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: file.id,
    });

    // Closest result related to the message
    const results = await vectorStore.similaritySearch(message, 4);

    const prevMessages = await db.message.findMany({
      where: {
        fileId,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 6,
    });

    const formattedPrevMessages = prevMessages.map((msg) => ({
      role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
      content: msg.text,
    }));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    

    // 3. Prepare prompt for Google's Generative AI
    const prompt = `
    Use the following pieces of context (or previous conversation if needed) to answer the user's question in markdown format.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.

    PREVIOUS CONVERSATION:
    ${formattedPrevMessages
      .map(
        (message) =>
          `${message.role === "user" ? "User" : "Assistant"}: ${
            message.content
          }\n`
      )
      .join("")}

    CONTEXT:
    ${results.map((r) => r.pageContent).join("\n\n")}

    USER INPUT: ${message}
  `;

    // 4. Generate response using Google's Generative AI
    const result = await model.generateContentStream(prompt);
    

    // 5. Process and store the response
    let fullResponse = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      process.stdout.write(chunkText);
    }
    

    // Store the response in the database
    await db.message.create({
      data: {
        text: fullResponse,
        isUserMessage: false,
        fileId,
        userId,
      },
    });
    

    // 6. Return the response as a stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(fullResponse);
        controller.close();
      },
    });
    

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
