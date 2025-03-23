export interface SignupFormData {
    username: string;
    email: string;
    password: string;
}

export interface SigninFormData {
    email: string;
    password: string;
}

export type SessionPayload = {
    id: string;
    isAdmin: boolean;
    exp: number;
}