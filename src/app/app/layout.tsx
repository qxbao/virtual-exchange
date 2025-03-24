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
        { children }
    </SocketProvider>
  );
}
