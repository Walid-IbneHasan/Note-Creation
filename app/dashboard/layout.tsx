import React from "react";
import DashboardNav from "../components/DashboardNav";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "./../lib/db";

async function getData({
  email,
  id,
  firstName,
  lastName,
  profileImage,
}: {
  email: string;
  id: string;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  profileImage: string | null | undefined;
}) {
  if (!id) {
    console.error("User ID is undefined.");
    return;
  }
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    const name = `${firstName ?? ""} ${lastName ?? ""}`;
    await prisma.user.create({
      data: {
        id: id,
        email: email,
        name: name,
      },
    });
  }
  if (!user?.stripeCustomerId) {
    const data = await stripe.customers.create({
      email: email,
    });
    await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        stripeCustomerId: data.id,
      },
    });
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getUser } = getKindeServerSession();

  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  console.log("User ID:", user.id);
  console.log("User Email:", user.email);

  await getData({
    email: user.email as string,
    firstName: user.given_name as string,
    id: user.id as string,
    lastName: user.family_name as string,
    profileImage: user.picture,
  });
  return (
    <div className="flex flex-col space-y-6 mt-10">
      <div className="container grid flex-1 gap-12  md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <DashboardNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
