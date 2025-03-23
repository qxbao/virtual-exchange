import { Modal } from "react-bootstrap";
import { FaCheck } from "react-icons/fa6";
import ThemeButton from "./Button";
import { FaBan } from "react-icons/fa";

interface AlertModalProps {
    show: boolean;
    onHide?: () => void;
    title: string;
    content?: React.ReactNode;
    isError: boolean;
}

export default function AlertModal({ show, onHide, title, content, isError }: AlertModalProps) {
    return (
        <Modal show={show} centered style={{transform: "scale(.9)"}} onHide={onHide} className="text-dark shadow-sm border-0">
            <Modal.Body className="p-5 text-center">
                <div className="mb-2 display-2">
                    {isError ? 
                        <FaBan className="text-danger" />    
                        : 
                        <FaCheck className="text-success" />
                    }
                </div>
                <div className={"fw-bold h4 mb-2 " + (isError ? "text-danger" : "text-success")}>
                    {title}
                </div>
                <div className="mb-4 text-secondary">
                    {content}
                </div>
                <ThemeButton
                    onClick={onHide}
                    className="px-5 py-2 bg-secondary text-white fw-normal border-0">Close</ThemeButton>
            </Modal.Body>
        </Modal>
    );
}