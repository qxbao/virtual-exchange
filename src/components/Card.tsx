import { Card } from "react-bootstrap";

export function TransparentCard({children, className = ""}: Readonly<{children: React.ReactNode, className: string}>) {
    return (
        <Card className={"bg-transparent border-2 border-secondary rounded-4 " + className}>
            <Card.Body className="p-3">
                {children}
            </Card.Body>
        </Card>
    );
}