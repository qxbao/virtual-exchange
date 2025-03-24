import NavigationBar from "@/components/Navigationbar";
import { SocketProvider } from "@/contexts/SocketContext";
import { verifySession } from "@/lib/dal";

export default async function RootAuthenticationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();
  return (
    <SocketProvider uid={Number(session?.id)}>
        <NavigationBar/>
        { children }
    </SocketProvider>
  );
}
