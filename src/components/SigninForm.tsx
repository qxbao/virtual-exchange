import { FormEvent, useRef, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { validateSigninFormData } from "@/services/validate";
import { SigninFormData } from "@/d.type";

interface SigninFormProps {
    onSubmit: (formData: SigninFormData) => void;
    onCancel: () => void;
}

export default function SigninForm({ onSubmit, onCancel }: SigninFormProps) {
    const [formData, setFormData] = useState<SigninFormData>({
        email: "",
        password: "",
    });
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState<SigninFormData>({
        email: "",
        password: ""
    });
    const formRef = useRef<HTMLFormElement>(null);

    const validateForm = (): boolean => {
        const validationErrors = validateSigninFormData(formData);
        setErrors(validationErrors);
        return Object.values(validationErrors).every(error => error === "");
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setValidated(true);

        if (!validateForm()) {
            return;
        }
        onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Form onSubmit={handleSubmit} ref={formRef} noValidate>
            <div className="mb-3">
                <label className="fw-semibold ms-1 mb-1 small">Username or email <span className="text-danger">*</span></label>
                <Form.Control
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Username or email"
                    className="py-2 px-3"
                    isInvalid={validated && errors.email !== ""}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
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
                            placeholder="Password"
                            className="py-2 px-3"
                            isInvalid={validated && errors.password !== ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    </div>
                </div>
            </div>

            <Row className="m-0">
                <Col xs={6} className="ps-0 pe-1">
                    <button type="button" onClick={onCancel} className="btn btn-outline-secondary w-100 py-2 fw-semibold">Cancel</button>
                </Col>
                <Col xs={6} className="pe-0 ps-1">
                    <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">Sign in</button>
                </Col>
            </Row>
        </Form>
    );
}
