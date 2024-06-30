import React from "react";
import { Layout, Typography, Menu, Button } from "antd";
import { AuditOutlined, BarChartOutlined, HomeOutlined, LoginOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import logo from "../logo.svg";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const { Header } = Layout;
const { Title } = Typography;

const defaultMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "home",
		icon: <HomeOutlined />,
	},
];

const userMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/user/dashboard'>Dashboard</Link>),
		key: "dashboard",
		icon: <BarChartOutlined />,
	},
];

const beneficiaryMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/beneficiary/dashboard'>Dashboard</Link>),
		key: "dashboard",
		icon: <BarChartOutlined />,
	},
];


const donorMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/donor/dashboard'>Dashboard</Link>),
		key: "dashboard",
		icon: <BarChartOutlined />,
	},
];


const adminMenu = [
	{
		label: (<Link to='/home'>Home</Link>),
		key: "home",
		icon: <HomeOutlined />,
	},
    {
		label: (<Link to='/admin/dashboard'>Dashboard</Link>),
		key: "dashboard",
		icon: <BarChartOutlined />,
	},
    {
		label: (<Link to='/admin/request'>Richieste</Link>),
		key: "request",
		icon: <AuditOutlined />,
	},
    {
		label: (<Link to='/admin/users'>Utenti</Link>),
		key: "users",
		icon: <UserOutlined />,
	},
];


const MainHeader = () => {
    const { isUser, isDonor, isBeneficiary, isAdmin } = useAuth()

    let selectedMenu = null
    if (isUser) {
        selectedMenu = userMenu
    } else if (isDonor) {
        selectedMenu = beneficiaryMenu
    } else if (isBeneficiary) {
        selectedMenu = donorMenu
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
			{selectedMenu !== null && <Menu mode="horizontal" style={{ borderBottom: "none" }} items={selectedMenu} />}
			{/* <Menu mode="horizontal" style={{ borderBottom: "none" }}>
				<Menu.Item key="login">
					<Button type="primary" icon={<LoginOutlined />}>
						Login
					</Button>
				</Menu.Item>
			</Menu> */}

			{selectedMenu !== null ?
            <Link to="logout/">
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
