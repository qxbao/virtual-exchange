'use server';

import { SigninFormSchema, SigninFormState, SignupFormSchema, SignupFormState } from "@/lib/definition";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/session";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";

export async function signup(state: SignupFormState, formData: FormData) {
    const validatedFields = await SignupFormSchema.safeParseAsync({
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
        }
    }
    const hashedPassword = await bcrypt.hash(validatedFields.data.password, 10);
    const user = await prisma.user.create({
        data: {
            username: validatedFields.data.username,
            email: validatedFields.data.email,
            password: hashedPassword,
        },
    });

    if (!user) {
        return {
            message: "Failed to create user",
        };
    }

    return {
        message: "User created successfully",
    }
}

export async function signin(state: SigninFormState, formData: FormData) {
    const validatedFields = await SigninFormSchema.safeParseAsync({
        username: formData.get("username"),
        password: formData.get("password"),
    });
    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
        }
    }
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: validatedFields.data.username },
                { email: validatedFields.data.username },
            ],
        },
    });
    await createSession(String(user?.id), user?.isAdmin as boolean);
    redirect("/app");
    return {
        message: "Signin successfully",
    }
}