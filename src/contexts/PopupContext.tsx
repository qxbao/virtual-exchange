'use client';
import ThemeButton from "@/components/Button";
import { createContext, ReactNode, useState } from "react";
import { Modal } from "react-bootstrap";
import { FaBan, FaCheck } from "react-icons/fa6";

type PopupContextType = {
    showPopup: (title: string,  message: ReactNode | string, isError: boolean, onConfirm: (() => void) | null) => void;
}

const PopupContext = createContext<PopupContextType>({} as PopupContextType);

export function PopupProvider({ children }: { children: React.ReactNode }) {
    const [alertShow, setAlertShow] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState<ReactNode | string>("");
    const [isAlertError, setIsAlertError] = useState(false);
    const [onConfirm, setOnConfirm] = useState<(() => void) | undefined>(undefined);
    const showPopup = (title: string, message: React.ReactNode | string, isError:boolean, onConfirm: (() => void) | null) => {
        setTitle(title);
        setMessage(message);
        setAlertShow(true);
        setIsAlertError(isError);
        if (onConfirm != null) setOnConfirm(() => onConfirm);
        else setOnConfirm(undefined);
    };

    return (
        <PopupContext.Provider value={{ showPopup }}>
            <Modal show={alertShow} centered style={{transform: "scale(.9)"}} className="text-dark shadow-sm border-0">
                <Modal.Body className="p-5 text-center">
                    <div className="mb-2 display-2">
                        {isAlertError ? 
                            <FaBan className="text-danger" />    
                            : 
                            <FaCheck className="text-success" />
                        }
                    </div>
                    <div className={"fw-bold h4 mb-2 " + (isAlertError ? "text-danger" : "text-success")}>
                        {title}
                    </div>
                    <div className="mb-5 text-secondary">
                        {message}
                    </div>
                    <div className="d-flex gap-2 align-items-center justify-content-center">
                        <ThemeButton
                            onClick={() => {
                                setAlertShow(false)
                            }}
                            className="px-5 py-2 bg-secondary text-white border-0">Close</ThemeButton>
                        <ThemeButton
                            onClick={() => {
                                setAlertShow(false)
                                if (onConfirm) onConfirm() 
                            }}
                            className="px-5 py-2 text-white border-0">Confirm</ThemeButton>
                    </div>
                </Modal.Body>
            </Modal>
            {children}
        </PopupContext.Provider>
    );
}

export { PopupContext };