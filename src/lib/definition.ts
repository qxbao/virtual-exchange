import { z } from 'zod';
import prisma from './prisma';
import bcrypt from 'bcrypt';

const usernameLengthError = { message: "Username must be between 6 and 25 characters" }

export const SignupFormSchema = z.object({
    username: z.string().min(6, usernameLengthError)
            .max(25, usernameLengthError)
            .regex(/^[a-zA-Z0-9]+$/, { message: "Username must contain only letters and numbers" })
            .trim()
            .refine(async (e) => {
                const user = await prisma.user.findFirst({
                    where: { username: e },
                    select: { id: true },
                });
                return !user;
            }, { message: "Username already exists" }),
    email: z.string().email({ message: "Please enter a valid email address" })
            .max(50, { message: "Email must not exceed 50 characters" })
            .trim()
            .refine(async (e) => {
                const user = await prisma.user.findFirst({
                    where: { email: e },
                    select: { id: true },
                });
                return !user;
            }, { message: "Email already exists" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" })
            .trim(),
});

export type SignupFormState =
  | {
      errorsform?: {
        username?: string[];
        email?: string[];
        password?: string[];
      }
      message?: string;
    }
  | undefined

export const SigninFormSchema = z.object({
    username: z.string()
            .trim()
            .refine(async (e) => {
                const user = await prisma.user.findFirst({
                    where: { OR: [{ username: e}, {email: e}] },
                    select: { id: true },
                });
                return user;
            }, { message: "This username or email didn't linked to any account" }),
    password: z.string()
            .trim()
}).refine(async (e) => {
    const user = await prisma.user.findFirst({
        where: { OR: [{ username: e.username}, {email: e.username}] },
        select: { password: true },
    });
    const passwordMatch = bcrypt.compare(e.password, user?.password || '');
    return passwordMatch;
}, { message: "Password is incorrect", path: ["password"] });

export type SigninFormState =
  | {
      errorsform?: {
        username?: string[];
        password?: string[];
      }
      message?: string;
    }
  | undefined;

export const MarketOrderFormSchema = z.object({
    symbol: z.string()
      .min(1, { message: "Symbol is required" })
      .refine(async (e) => {
        const market = await prisma.marketData.findFirst({
          where: { symbol: e },
          select: { id: true },
        });
        return !!market;
      }, { message: "Market data not found" }),
    type: z.enum(["MARKET", "LIMIT", "STOP"], {
      message: "Invalid order type"
    }),
    side: z.enum(["BUY", "SELL"]),
    quantity: z.number().positive({ message: "Quantity must be greater than 0" }),
    stopPrice: z.number().optional(),
})

export const LimitOrderFormSchema = MarketOrderFormSchema.extend({
    stopPrice: z.number().positive({ message: "Stop price must be greater than 0" })
});

export type OrderState = {
  errors?: {
    symbol?: string[];
    type?: string[];
    side?: string[];
    quantity?: string[];
    stopPrice?: string[];
  };
  message?: string;
  isErr?: boolean;
} | undefined;