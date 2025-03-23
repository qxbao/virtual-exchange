import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
    const body = await request.json();
    const { email, password } = body;
    const validate = [email, password].every((field) => field !== "");
    if (!validate) {
        return NextResponse.json(
            {
                error: "Invalid Form Data",
                message: "No blank fields allowed",
            },
            { status: 500 }
        );
    }

    const user = await prisma.user.findFirst({
        where: { 
            OR: [{ email }, { username: email }],
         },
    })

    if (!user) {
        return NextResponse.json(
            {
                error: "Invalid Form Data",
                message: "User not found",
            },
            { status: 500 }
        );
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return NextResponse.json(
            {
                error: "Invalid Form Data",
                message: "Incorrect password",
            },
            { status: 500 }
        );
    }
    await createSession(String(user.id), user.isAdmin);
    return NextResponse.json({
        message: "User signed in",
    });
}