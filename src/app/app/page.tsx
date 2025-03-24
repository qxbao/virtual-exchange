
export default function AuthenticatedHome() {
    const username = "";
    return (
            <div>
                <h1>{username}</h1>
                <p>This page is only visible to authenticated users.</p>
            </div>
    );
}