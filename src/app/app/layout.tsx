import NavigationBar from "@/components/Navigationbar";
import { SocketProvider } from "@/contexts/SocketContext";
import { verifySession } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function RootAuthenticationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: Number(session?.id) },
  });
  if (!user) {
    await deleteSession();
    redirect("/w");
  }
  return (
    <SocketProvider uid={Number(session?.id)}>
        <NavigationBar userId={user?.id} username={user?.username as string}/>
        { children }
    </SocketProvider>
  );
}
