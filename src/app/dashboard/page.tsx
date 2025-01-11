import Dashboard from "@/components/Dashboard";
import db from "@/lib/db";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata : Metadata = {
  title : "Dashboard"
}


const DashboardPage = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) redirect("/auth-callback?origin=dashboard");

  const dbUser = await db.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=dashboard");

  const { isSubscribed } = await getUserSubscriptionPlan();

  return <Dashboard isSubscribed={isSubscribed} />;
};

export default DashboardPage;
