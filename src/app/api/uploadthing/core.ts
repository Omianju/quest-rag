import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import db from "@/lib/db";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import pc from "@/lib/pinecone";
import { PineconeStore } from "@langchain/pinecone";

import { embeddings } from "@/lib/embedding";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new UploadThingError("Unauthorized");

  const subscriptionPlan = await getUserSubscriptionPlan();

  return { subscriptionPlan, userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const fileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (fileExist) return;

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
    const pagesAmt = pageLevelDocs.length;

    const { isSubscribed } = metadata.subscriptionPlan;

    const isProExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;
    const isFreeExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });

      return;
    }

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
};

// Upload Thing Router for authenticating and processing the data after uploading

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
