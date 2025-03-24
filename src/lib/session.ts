import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { SessionPayload } from "@/d.type";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = ""):Promise<SessionPayload | null> {
    try {
        const { payload } : { payload:SessionPayload } = await jwtVerify(session, encodedKey, {
            algorithms: ["HS256"],
        });
        return payload;
    } catch (_) {
        console.error("Failed to verify session");
        return null;
    }
}

export async function createSession(userId: string, isAdmin: boolean) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime();
    const session = await encrypt({ id: userId, exp: expiresAt, isAdmin });
    const cookieStore = await cookies();
    cookieStore.set("session", session, {
        httpOnly: true,
        expires: expiresAt,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
}

export async function updateSession() {
    const session = (await cookies()).get("session")?.value;
    const payload = await decrypt(session);

    if (!session || !payload) {
        return null;
    }

    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const cookieStore = await cookies();
    cookieStore.set("session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expires,
        sameSite: "lax",
        path: "/",
    });
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}
