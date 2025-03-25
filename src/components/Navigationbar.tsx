'use client'
import Link from "next/link";
import { Container, Nav, Navbar } from "react-bootstrap";
import { FaCircleUser, FaRegUser } from "react-icons/fa6";
import { useState } from "react";
import style from '@/assets/styles/navbar.module.css'
import { MdOutlinePowerSettingsNew } from "react-icons/md";

const navItems: Record<string, string> = {
	"Markets": "/app",
	"Trade": "/app/trade",
}

export default function NavigationBar({ userId, username }: { userId: number, username: string }) {
	const [userDropdown, setUserDropdown] = useState(false);
	return (
		<Navbar expand="lg" className="bg-transparent" variant="dark">
			<Container fluid className="px-4 py-2 text-light">
				<Link href="/app" className="me-4">
					<div className="h3 mb-0 text-theme fw-black">VirtualX</div>
				</Link>
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
				<div className="d-flex align-items-center gap-2">
					<div className="position-relative" onMouseOver={() => setUserDropdown(true)} onMouseLeave={() => setUserDropdown(false)}>
						<FaRegUser className="me-2 fs-5" />
						<DropdownItem isShow={userDropdown}>
							<div className="d-flex gap-2 mb-3">
								<div>
									<FaCircleUser className="fs-1 text-secondary" />
								</div>
								
								<div className="small">
									<div>{username}</div>
									<div className="small text-secondary">UID: {userId}</div>
								</div>
							</div>
							<button className="w-100 py-1 border-1 border-secondary border bg-transparent rounded-pill smaller text-black">
								Go to profile
							</button>
							<hr className="opacity-50 mt-4 text-secondary mb-2"/>
							<Link href="/user/logout" className="small d-flex align-items-center py-2">
								<MdOutlinePowerSettingsNew className="fs-4 me-2"/>
								Sign out
							</Link>							
						</DropdownItem>
					</div>
					<Navbar.Toggle />
				</div>
			</Container>
		</Navbar>
	);
}

function DropdownItem({children, isShow}:  {children: React.ReactNode, isShow: boolean}) {
	return (
		<div className={`${style.dropdownItem} ${isShow ? style.show : ""}`}>
			<div className={`rounded-3 px-4 py-3 ${style.dropdownContent}`}>
				{children}
			</div>
		</div>
	);
}