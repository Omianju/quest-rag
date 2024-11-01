import Dashboard from "@/components/Dashboard";
import db from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";



const DashboardPage = async () => {
    

    const {getUser} = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.id) redirect("/auth-callback?origin=dashboard")
    
    const dbUser = await db.user.findUnique({
        where : {
            id : user.id
        }
    })

    if (!dbUser) redirect("/auth-callback?origin=dashboard")

    return (
        <Dashboard />
    )
}

export default DashboardPage