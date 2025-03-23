'use client';
import ThemeButton from "@/components/Button";
import { Col, Container, Modal, Row } from "react-bootstrap";
import TradingVector from "@/assets/images/TradingVector.png";
import Image from "next/image";
import { useState } from "react";
import SignupForm from "@/components/SignupForm";
import SigninForm from "@/components/SigninForm";
import AlertModal from "@/components/AlertModal";
import { SignupFormData, SigninFormData } from "@/d.type";
import { useRouter } from "next/navigation"

export default function Home() {
	const [signupShow, setSignupShow] = useState(false);
	const [signinShow, setSigninShow] = useState(false);
	const [alertShow, setAlertShow] = useState(false);
	const [alertTitle, setAlertTitle] = useState("");
	const [alertContent, setAlertContent] = useState("");
	const [isAlertError, setIsAlertError] = useState(false);
	const router = useRouter();

	const displayAlert = (title: string, content: string, isError: boolean) => {
		setAlertShow(true);
		setAlertTitle(title);
		setAlertContent(content);
		setIsAlertError(isError);
	};

	
	const handleSignupSubmit = (formData: SignupFormData) => {
		fetch("/api/users/signup", {
			method: "POST",
			body: JSON.stringify(formData),
			headers: {
				"Content-Type": "application/json",
			},
		}).then((res) => {
			if (res.ok) {
				setSignupShow(false);
				displayAlert("Account created", "You have successfully created an account", false);
			} else {
				res.json().then((data) => displayAlert("Error", data.message, true))
			}
		});
	}		

	const handleSigninSubmit = (formData: SigninFormData) => {
		fetch("/api/users/signin", {
			method: "POST",
			body: JSON.stringify(formData),
			headers: {
				"Content-Type": "application/json",
			},
		}).then((res) => {
			if (res.ok) {
				setSigninShow(false);
				displayAlert("Sign in successful", "You have successfully signed in", false);
				router.push("/app");
			} else {
				res.json().then((data) => displayAlert("Error", data.message, true))
			}
		});
	}
	
	return (
		<Container className="py-5 d-flex flex-grow-1">
			<AlertModal
				title={alertTitle}
				content={alertContent}
				show={alertShow}
				isError={isAlertError}
				onHide={() => setAlertShow(false)}
			/>
			<Row>
				<Col lg={8} xs={12} className="mb-5 mb-lg-0 d-flex flex-column justify-content-center align-items-center align-items-lg-start flex-grow-1 text-center text-lg-start order-1 order-lg-0">
					<div className="fw-bold h2 text-theme mb-5">
						VirtualExchange
					</div>
					<div className="display-4 fw-bold">
						A Risk-Free Mock Trading Platform
					</div>
					<div className="fs-4 mt-4 w-75 text-secondary">
						Claim your <b>3,000 USDT</b> instantly and <b>100 USDT</b> daily to start copying expert trades
					</div>
					<div className="mt-5 d-flex gap-3">
						<ThemeButton
							className="px-5 border-0 py-3 fs-4"
							onClick={() => setSignupShow(true)}>
							Sign up
						</ThemeButton>
						<ThemeButton 
							className="px-5 py-3 fs-4 bg-transparent border border-3 border-secondary text-secondary"
							onClick={() => setSigninShow(true)}>
							Sign in
						</ThemeButton>
					</div>
				</Col>
				<Col lg={4} xs={12} className="d-flex justify-content-center align-items-center order-0 order-lg-1">
					<Image
						src={TradingVector}
						width={500}
						className="mw-100 img-fluid"
						alt="" />
				</Col>
			</Row>
			<Modal show={signupShow} centered onHide={() => setSignupShow(false)} className="text-dark">
				<Modal.Header className="flex-column align-items-start border-bottom-0 p-5 pb-4">
					<div className="fw-bold h2 mb-0">
						Create an account
					</div>
					<div className="small text-secondary">
						Already have an account? <a href="#" className="text-primary" onClick={(e) => {e.preventDefault(); setSignupShow(false); setSigninShow(true);}}>Sign in</a>
					</div>
				</Modal.Header>
				<Modal.Body className="p-5 d-block pt-0">
					<SignupForm 
						onSubmit={handleSignupSubmit}
						onCancel={() => setSignupShow(false)}
					/>
				</Modal.Body>
			</Modal>
			
			<Modal show={signinShow} centered onHide={() => setSigninShow(false)} className="text-dark">
				<Modal.Header className="flex-column align-items-start border-bottom-0 pb-4 p-5">
					<div className="fw-bold h2 mb-0">
						Sign in
					</div>
					<div className="small text-secondary">
						{"Don't have an account? "}
						 <a
						 	href="#"
							className="text-primary"
							onClick={(e) => {
								e.preventDefault();
								setSigninShow(false);
								setSignupShow(true);
							}}
						>
							Sign up
						</a>
					</div>
				</Modal.Header>
				<Modal.Body className="p-5 d-block pt-0">
					<SigninForm 
						onSubmit={handleSigninSubmit}
						onCancel={() => setSigninShow(false)}
					/>
				</Modal.Body>
			</Modal>
		</Container>
	);
}
