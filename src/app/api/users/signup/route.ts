import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { validateSignupFormData } from "@/services/validate";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { username, email, password } = body;
    const error = validateSignupFormData({ username, email, password });
    if (!Object.values(error).every((error) => error === "")) {
        return NextResponse.json(
            {
                error: "Invalid Form Data",
                message: Object.values(error).filter(
                    (error) => error !== ""
                )[0],
            },
            { status: 500 }
        );
    }
    const u = await prisma.user.findFirst({
        where: {
            OR: [{ username }, { email }],
        },
    });
    if (u) {
        for (const key of ["username", "email"]) {
            if (u[key as keyof typeof u] == body[key]) {
                return NextResponse.json(
                    {
                        error: "User Already Exists",
                        message: `The ${key} is already taken.`,
                    },
                    { status: 500 }
                );
            }
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
        },
    });
    return NextResponse.json({
        message: "User created successfully.",
    });
}
