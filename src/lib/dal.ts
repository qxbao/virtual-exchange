import 'server-only'
 
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { cache } from 'react'
import prisma from './prisma'
import { SessionPayload } from '@/d.type'
 
export const verifySession:() => Promise<SessionPayload | null> = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session:SessionPayload|null = await decrypt(cookie)
  
  if (!session?.id) {
    return null;
  } else {
    const user = await prisma.user.findUnique({
      where: { id: Number(session?.id) }
    });
    
    if (!user) {
      return null;
    }

    return session;
  }
})

export const getCurrentUser = cache(async () => {
    const session = await verifySession() 
    if (!session) {
        return null;
    }
    
    const user = await prisma.user.findUnique({
        where: { id: Number(session.id) }
    });

    return user;
});