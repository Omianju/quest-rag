import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db"




export const POST = async (req : NextRequest, res: NextResponse) => {
    // Authorising after that receiving and sending message.
    const body = await req.json()
    const { getUser } = getKindeServerSession()
    const { id : userId } = await getUser()

    if (!userId) return new Response("Unauthorised", {status : 401})
    
    const { fileId, message } = SendMessageValidator.parse(body)

    const file = await db.file.findUnique({
        where : {
            id : fileId,
            userId 
        }
    })

    if (!file) return new Response("file not found!", {status : 404})
    
    await db.message.create({
        data : {
            text : message,
            isUserMessage : true,
            fileId,
            userId,
        }
    })

    // AI
}