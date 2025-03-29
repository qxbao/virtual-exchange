import { useActionState, useContext, useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { SigninFormData } from "@/d.type";
import { signin } from "@/actions/auth";
import { PopupContext } from "@/contexts/PopupContext";

interface SigninFormProps {
    onCancel: () => void;
}

export default function SigninForm({ onCancel }: SigninFormProps) {
    const [formData, setFormData] = useState<SigninFormData>({
        username: "",
        password: "",
    });
    const [state, formAction, isPending] = useActionState(signin, undefined);
    const { showPopup } = useContext(PopupContext);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
            if (!state?.message) return;
    
            if (state?.message !== "User created successfully" && state?.message) {
                showPopup("Error", state?.message, true);
            }
            onCancel();
            showPopup("Success", state?.message, false);
        }, [onCancel, showPopup, state?.message]);

    return (
        <Form action={formAction} noValidate>
            <div className="mb-3">
                <label className="fw-semibold ms-1 mb-1 small">Username or email <span className="text-danger">*</span></label>
                <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username or email"
                    disabled={isPending}
                    className="py-2 px-3"
                    isInvalid={ Boolean(state?.errors?.username) }
                />
                <Form.Control.Feedback type="invalid">{state?.errors?.username}</Form.Control.Feedback>
            </div>

            <div className="mb-5">
                <label className="fw-semibold ms-1 mb-1 small">Password <span className="text-danger">*</span></label>
                <div className="d-flex">
                    <div className="flex-grow-1">
                        <Form.Control
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isPending}
                            placeholder="Password"
                            className="py-2 px-3"
                            isInvalid={Boolean(state?.errors?.password)}
                        />
                        <Form.Control.Feedback type="invalid">{state?.errors?.password}</Form.Control.Feedback>
                    </div>
                </div>
            </div>

            <Row className="m-0">
                <Col xs={6} className="ps-0 pe-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-outline-secondary w-100 py-2 fw-semibold">Cancel</button>
                </Col>
                <Col xs={6} className="pe-0 ps-1">
                    <button
                        disabled={isPending}
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-semibold">Sign in</button>
                </Col>
            </Row>
        </Form>
    );
}

