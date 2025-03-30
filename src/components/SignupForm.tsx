'use client';

import { useActionState, useContext, useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { signup } from "@/actions/auth";
import { PopupContext } from "@/contexts/PopupContext";

interface SignupFormProps {
    onCancel: () => void;
}

export default function SignupForm({ onCancel }: SignupFormProps) {
    const [state, formAction, isPending] = useActionState(signup, undefined);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    })
    const { showPopup } = useContext(PopupContext);

    useEffect(() => {
        if (!state?.message) return;

        if (state?.message !== "User created successfully" && state?.message) {
            showPopup("Error", state?.message, true, null);
        }
        onCancel();
        showPopup("Success", state?.message, false, null);
    }, [onCancel, showPopup, state?.message]);

    return (
        <Form action={formAction}>
            <div className="mb-3">
                <label className="fw-semibold ms-1 mb-1 small">Username <span className="text-danger">*</span></label>
                <Form.Control
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    className="py-2 px-3"
                    disabled={isPending}
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    isInvalid={Boolean(state?.errors?.username)}
                />
                <Form.Control.Feedback type="invalid">{state?.errors?.username}</Form.Control.Feedback>
            </div>

            <div className="mb-3">
                <label className="fw-semibold ms-1 mb-1 small">Email <span className="text-danger">*</span></label>
                <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled={isPending}
                    placeholder="Enter your email"
                    className="py-2 px-3"
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    isInvalid={Boolean(state?.errors?.email)}
                />
                <Form.Control.Feedback type="invalid">{state?.errors?.email}</Form.Control.Feedback>
            </div>

            <div className="mb-4">
                <label className="fw-semibold ms-1 mb-1 small">Password <span className="text-danger">*</span></label>
                <div className="d-flex">
                    <div className="flex-grow-1">
                        <Form.Control
                            type="password"
                            value={formData.password}
                            disabled={isPending}
                            name="password"
                            autoComplete="current-password"
                            placeholder="Create a password"
                            className="py-2 px-3"
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            isInvalid={Boolean(state?.errors?.password)}
                            minLength={8}
                        />
                        <Form.Control.Feedback type="invalid">{state?.errors?.password}</Form.Control.Feedback>
                    </div>
                </div>
            </div>

            <Row className="m-0">
                <Col xs={6} className="ps-0 pe-1">
                    <button type="button" onClick={onCancel} className="btn btn-outline-secondary w-100 py-2 fw-semibold">Cancel</button>
                </Col>
                <Col xs={6} className="pe-0 ps-1">
                    <button disabled={isPending} type="submit" className="btn btn-primary w-100 py-2 fw-semibold">Sign up</button>
                </Col>
            </Row>
        </Form>
    );
}