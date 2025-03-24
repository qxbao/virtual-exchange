import { FormEvent, useEffect, useRef, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { validateSignupFormData } from "@/lib/validate";
import { SignupFormData } from "@/d.type";

interface SignupFormProps {
    onSubmit: (formData: SignupFormData) => void;
    onCancel: () => void;
}

export default function SignupForm({ onSubmit, onCancel }: SignupFormProps) {
    const [formData, setFormData] = useState<SignupFormData>({
        username: "",
        email: "",
        password: "",
    });
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState<SignupFormData>({
        username: "",   
        email: "",
        password: ""
    });
    const formRef = useRef<HTMLFormElement>(null);

    const validateForm = (): boolean => {
        const validationErrors = validateSignupFormData(formData);

        setErrors(validationErrors);
        return Object.values(validationErrors).every(error => error == "");
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            setValidated(false);
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

    useEffect(() => {
        setErrors(validateSignupFormData(formData));
    }, [formData]);

    return (
        <Form onSubmit={handleSubmit} ref={formRef} noValidate validated={validated}>
            <div className="mb-3">
                <label className="fw-semibold ms-1 mb-1 small">Username <span className="text-danger">*</span></label>
                <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className="py-2 px-3"
                    isInvalid={errors.username != ""}
                    isValid={errors.username == ""}
                />
                <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
            </div>

            <div className="mb-3">
                <label className="fw-semibold ms-1 mb-1 small">Email <span className="text-danger">*</span></label>
                <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="py-2 px-3"
                    isInvalid={errors.email != ""}
                    isValid={errors.email == ""}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </div>

            <div className="mb-4">
                <label className="fw-semibold ms-1 mb-1 small">Password <span className="text-danger">*</span></label>
                <div className="d-flex">
                    <div className="flex-grow-1">
                        <Form.Control
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            className="py-2 px-3"
                            isInvalid={errors.password != ""}
                            isValid={errors.password == ""}
                            minLength={8}
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
                    <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">Sign up</button>
                </Col>
            </Row>
        </Form>
    );
}