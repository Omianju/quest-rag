"use client"





import { trpc } from '@/app/_trpc/client'
import { absoluteUrl } from '@/lib/utils'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import { httpBatchLink } from '@trpc/client'
import { PropsWithChildren, useState } from 'react'

const Providers = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: absoluteUrl("/api/trpc"),
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>    
      <trpc.Provider
        client={trpcClient}
        queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>

  )
}


export default Providers;
