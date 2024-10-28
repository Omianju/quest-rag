import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import db from "@/lib/db";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import pc from "@/lib/pinecone";
import { PineconeStore } from "@langchain/pinecone";

import { embeddings  } from "@/lib/embedding";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user || !user.id) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          url: file.url,
          userId: metadata.userId,
          uploadStatus: "PROCESSING",
        },
      });

      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        /**
         * PDFLoader is initialized with the path to your PDF file.
          The load() method extracts the text from the PDF and returns it as an array of documents. Each document contains the text and metadata from the PDF.
         */

        const loader = new PDFLoader(blob);
        const pageLevelDocs = await loader.load();
        
        // left for pdfLength
        pageLevelDocs.length;
      
        // vectorizing and index entire document

        /**
         * When you create an instance of pinecone.Index("your_index_name"), it establishes a connection to the Pinecone service, targeting the specific index you provide in the argument.
         *
         * "your_index_name" is the name of the index you want to interact with. This index must have been previously created in Pinecone.
         */

        const pineconeIndex = pc.Index("quest-rag");

        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          pineconeIndex,
          namespace: createdFile.id,
        });
        

          await db.file.update({
            where: {
              id: createdFile.id,
            },
            data: {
              uploadStatus: "SUCCESS",
            },
          });
      } catch (err) {
        console.log(err);
          await db.file.update({
            where: {
              id: createdFile.id,
            },
            data: {
              uploadStatus: "FAILED",
            },
          });
      }
    }),
} satisfies FileRouter;



export type OurFileRouter = typeof ourFileRouter;
