import { getCurrentUser } from "@/lib/dal";

export default async function AuthenticatedHome() {
    const user = await getCurrentUser();
    return (
        <div>
            <h1>{user?.username}</h1>
            <p>This page is only visible to authenticated users.</p>
        </div>
    );
}