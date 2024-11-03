import BillingForm from "@/components/BillingForm";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import React from "react";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const BillingPage = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) {
    redirect('/auth-callback?origin=dashboard/billing');
  }

  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <BillingForm subscriptionPlan={subscriptionPlan} />
  );
};

export default BillingPage;
