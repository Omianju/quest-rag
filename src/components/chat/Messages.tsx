import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { Loader2, MessageSquare } from "lucide-react";
import Message from "./Message";
import Skeleton from "react-loading-skeleton";
import { ChatContext } from "./ChatContext";
import { useContext, useEffect, useRef } from "react";
import { useIntersection } from "@mantine/hooks"
interface MessagesProps {
  fileId: string;
}

export const Messages = ({ fileId }: MessagesProps) => {
  const { data, isLoading, fetchNextPage } = trpc.getFileMessages.useInfiniteQuery(
    {
      fileId,
      limit: INFINITE_QUERY_LIMIT,
    },
    {
      getNextPageParam: (lastpage) => lastpage?.nextCursor,
    }
  );

  console.log(data)

  const { isLoading: isAiThinking } = useContext(ChatContext) 
  const messages = data?.pages.flatMap((page) => page.messages);

  

  

  const loadingMessage = {
    id: "loading-message",
    createdAt: new Date().toISOString(),
    isUserMessage: false,
    text: (
      <span className="flex items-center justify-center h-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    ),
  };

  const combinedMessages = [
    ...(isAiThinking ? [loadingMessage] : []),
    ...(messages ?? []),
  ];

  const lastMessageRef = useRef<HTMLDivElement>(null)
  const {entry , ref} = useIntersection({
    root : lastMessageRef.current,
    threshold : 1
  })

  useEffect(()=>{
    if(entry?.isIntersecting) {
      fetchNextPage()
    }
  },[entry, fetchNextPage])

  console.log({combinedMessages})
  console.log({messages})

  return (
    <div className="flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
      {combinedMessages && combinedMessages.length > 0 ? (
        <div>
          {combinedMessages.reverse().map((message, i) => {
            const isNextMessageSamePerson =
              combinedMessages[i - 1]?.isUserMessage ===
              combinedMessages[i]?.isUserMessage;

            if (i === 0) {
              return (
                <Message
                  ref={ref}
                  key={message.id}
                  message={message}
                  isNextMessageSamePerson={isNextMessageSamePerson}
                />
              );
            } else {
              return (
                <Message
                  key={message.id}
                  message={message}
                  isNextMessageSamePerson={isNextMessageSamePerson}
                  
                />
              );
            }
          })}
        </div>
      ) : isLoading ? (
        <div className="w-full flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          <h3 className="font-semibold text-xl">You&apos;re all set!</h3>
          <p className="text-zinc-500 text-sm">
            Ask your first question to get started.
          </p>
        </div>
      )}
    </div>
  );
};
