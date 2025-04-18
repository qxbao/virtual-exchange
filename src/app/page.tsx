'use client';
import ThemeButton from "@/components/Button";
import { Col, Container, Modal, Row } from "react-bootstrap";
import TradingVector from "@/assets/images/TradingVector.png";
import Image from "next/image";
import { useState } from "react";
import SignupForm from "@/components/SignupForm";
import SigninForm from "@/components/SigninForm";

export default function Home() {
	const [signupShow, setSignupShow] = useState(false);
	const [signinShow, setSigninShow] = useState(false);

	return (
		<Container className="py-5 d-flex flex-grow-1">
			<Row>
				<Col lg={8} xs={12} className="mb-5 mb-lg-0 d-flex flex-column justify-content-center align-items-center align-items-lg-start flex-grow-1 text-center text-lg-start order-1 order-lg-0">
					<div className="fw-bold h2 text-theme mb-5">
						VirtualX
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
						onCancelAction={() => setSignupShow(false)}
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
						onCancel={() => setSigninShow(false)}
					/>
				</Modal.Body>
			</Modal>
		</Container>
	);
}
