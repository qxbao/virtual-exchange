'use client'
import Link from "next/link";
import { Container, Nav, Navbar } from "react-bootstrap";
import '@/assets/styles/navbar.module.css'

const navItems: Record<string, string> = {
	"Markets": "/app/markets",
	"Trade": "/app/trade",
}

export default function NavigationBar() {
	return (
		<Navbar expand="lg" className="bg-transparent" variant="dark">
			<Container fluid className="px-4 py-2 text-light">
				<Link href="/app" className="me-4">
					<div className="h3 mb-0 text-theme fw-black">VirtualX</div>
				</Link>
				<Navbar.Toggle />
				<Navbar.Collapse >
					<Nav className="me-auto align-items-lg-center gap-4">
						{
							Object.keys(navItems).map((key) => {
								return (
									<Link key={key} href={navItems[key]}>
										<div className="small">
											{key}
										</div>
									</Link>
								);
							})
						}
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	);
}