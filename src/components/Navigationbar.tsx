'use client'
import Link from "next/link";
import { Container, Nav, Navbar } from "react-bootstrap";
import { FaCircleUser, FaRegUser } from "react-icons/fa6";
import { useState } from "react";
import style from '@/assets/styles/navbar.module.css'
import { MdOutlinePowerSettingsNew } from "react-icons/md";
import useAssets from "@/hooks/useAssets";

const navItems: Record<string, string> = {
	"Markets": "/app",
	"Trade": "/app/trade",
}

export default function NavigationBar({ userId, username }: { userId: number, username: string }) {
	const [userDropdown, setUserDropdown] = useState(false);
	const { balance } = useAssets();
	const [hideBalance, setHideBalance] = useState(false);
	return (
		<Navbar expand="lg" className="bg-transparent" variant="dark">
			<Container fluid className="px-4 py-2 text-light">
				<Link href="/app" className="me-4">
					<div className="h3 mb-0 text-theme fw-black">VirtualX</div>
				</Link>
				<div className="d-flex align-items-center gap-2 order-lg-1 order-0">
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
							<button className="w-100 py-1 border-2 border-secondary border bg-transparent rounded-pill smaller text-dark"
								onClick={() => {
									setHideBalance(!hideBalance);
								}}
								>
								{ hideBalance ? balance.toLocaleString("en-US", { style: "currency", currency: "USD" }) : balance }
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
				<Navbar.Collapse className="order-lg-0 order-1" >
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

function DropdownItem({children, isShow}:  {children: React.ReactNode, isShow: boolean}) {
	return (
		<div style={{zIndex: 5}} className={`${style.dropdownItem} ${isShow ? style.show : ""}`}>
			<div className={`rounded-3 px-4 py-3 ${style.dropdownContent}`}>
				{children}
			</div>
		</div>
	);
}