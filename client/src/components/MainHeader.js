import React, { useEffect, useState } from "react";
import { Layout, Typography, Menu, Button } from "antd";
import { AuditOutlined, BarChartOutlined, EuroOutlined, HomeOutlined, LoginOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import logo from "../logo.svg";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const { Header } = Layout;
const { Title } = Typography;

const defaultMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "/home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/campaigns'>Campaigns</Link>),
		key: "/campaigns",
		icon: <EuroOutlined />,
	},
];

const userMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "/home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/campaigns'>Campaigns</Link>),
		key: "/campaigns",
		icon: <EuroOutlined />,
	},
    {
		label: (<Link to='/user/dashboard'>Dashboard</Link>),
		key: "/user/dashboard",
		icon: <BarChartOutlined />,
	},
];

const beneficiaryMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "/home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/campaigns'>Campaigns</Link>),
		key: "/campaigns",
		icon: <EuroOutlined />,
	},
    {
		label: (<Link to='/beneficiary/dashboard'>Dashboard</Link>),
		key: "/beneficiary/dashboard",
		icon: <BarChartOutlined />,
	},
    {
		label: (<Link to='/beneficiary/profile'>Profile</Link>),
		key: "/beneficiary/profile",
		icon: <UserOutlined />,
	},
];


const donorMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "/home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/campaigns'>Campaigns</Link>),
		key: "/campaigns",
		icon: <EuroOutlined />,
	},
    {
		label: (<Link to='/donor/dashboard'>Dashboard</Link>),
		key: "/donor/dashboard",
		icon: <BarChartOutlined />,
	},
    {
		label: (<Link to='/donor/profile'>Profile</Link>),
		key: "/donor/profile",
		icon: <UserOutlined />,
	},
];


const adminMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "/home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/admin/dashboard'>Dashboard</Link>),
		key: "/admin/dashboard",
		icon: <BarChartOutlined />,
	},
    {
		label: (<Link to='/admin/campaigns'>Campaigns</Link>),
		key: "/admin/campaigns",
		icon: <EuroOutlined />,
	},
    {
		label: (<Link to='/admin/requests'>Richieste</Link>),
		key: "/admin/requests",
		icon: <AuditOutlined />,
	},
    {
		label: (<Link to='/admin/users'>Utenti</Link>),
		key: "/admin/users",
		icon: <UserOutlined />,
	},
];


const MainHeader = () => {
    let location = useLocation()

    // for dynamic update of the menu based on location
    const [current, setCurrent] = useState(
        location.pathname === "/" || location.pathname === ""
            ? "/home"
            //When reaching '/campaigns/campaingId' I overwrite the current to highlights Campaigns
            : (location.pathname.includes("/campaigns/") ? '/campaigns' : location.pathname),
    );

    // keeps the current updated
    useEffect(() => {
        if (location) {
            if(current !== location.pathname) {
                // A key in the menu is highlighted only if the location is equal to the current value
                let newCurrent = location.pathname
                // When reaching '/campaigns/campaingId' I overwrite the current to highlights Campaigns
                if (location.pathname.includes("/campaigns/")) newCurrent = '/campaigns'
                setCurrent(newCurrent);
            }
        }
    }, [location, current]);

    // when I click set the right key, might be not needed since the location will change due the Link component
    function handleClick(e) {
        setCurrent(e.key);
    }

    const { status, isUser, isDonor, isBeneficiary, isAdmin } = useAuth()

    let selectedMenu = defaultMenu
    if (isUser) {
        selectedMenu = userMenu
    } else if (isDonor) {
        selectedMenu = donorMenu
    } else if (isBeneficiary) {
        selectedMenu = beneficiaryMenu
    } else if (isAdmin) {
        selectedMenu = adminMenu
    }

	return (
		<Header
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				backgroundColor: "#fff",
				boxShadow: "0 2px 8px #f0f1f2",
			}}
		>
			<div style={{ display: "flex", alignItems: "center" }}>
				<img
					src={logo}
					alt="Logo"
					style={{ height: "40px", marginRight: "10px" }}
				/>
                <Link to="/">
				    <h1 style={{ margin: 0 }}>CharityChain</h1>
                </Link>
			</div>
			{selectedMenu !== null && <Menu onClick={handleClick} selectedKeys={[current]} mode="horizontal" style={{ borderBottom: "none" }} items={selectedMenu} />}
			{/* <Menu mode="horizontal" style={{ borderBottom: "none" }}>
				<Menu.Item key="login">
					<Button type="primary" icon={<LoginOutlined />}>
						Login
					</Button>
				</Menu.Item>
			</Menu> */}

			{status !== null ?
            <Link to="/logout">
				<Button type="primary" icon={<LogoutOutlined />}>
					Logout
				</Button>
			</Link>
            :
            <Link to="/login">
				<Button type="primary" icon={<LoginOutlined />}>
					Login
				</Button>
            </Link>
            }
		</Header>
	);
};

export default MainHeader;
