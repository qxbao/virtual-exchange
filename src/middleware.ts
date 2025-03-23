import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session";

const publicRoutes = ['/'];
const protectedRoutes = ['/app']

export default async function middleware(req: NextRequest) {
    const { pathname: path } = req.nextUrl;
    const isProtectedRoute = protectedRoutes.includes(path)
    const isPublicRoute = publicRoutes.includes(path)

    const cookie = (await cookies()).get('session')?.value
    const session = await decrypt(cookie)

    if (isProtectedRoute && !session?.id) {
        return NextResponse.redirect(new URL('/', req.nextUrl))
    }

    if (isPublicRoute && session?.id) {
        return NextResponse.redirect(new URL('/app', req.nextUrl))
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}