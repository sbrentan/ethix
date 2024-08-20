import React, { useEffect, useState } from "react";
import { Layout, Typography, Menu, Button, Row, Col, Space } from "antd";
import Icon, { AuditOutlined, BarChartOutlined, EuroOutlined, HeartOutlined, HomeOutlined, LoginOutlined, LogoutOutlined, QrcodeOutlined, UserOutlined } from "@ant-design/icons";
import logo from "../logo.svg";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import CustomSvg from "./CustomSvg";

const { Header } = Layout;
const { Title } = Typography;

const DontaionIcon = (props) => (
    <Icon component={CustomSvg} {...props} />
);

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
    {
		label: (<Link to='/organizations'>Organizations</Link>),
		key: "/organizations",
		icon: <HeartOutlined />,
	},
    {
		label: (<Link to='/redeem'>Redeem</Link>),
		key: "/redeem",
		icon: <QrcodeOutlined />,
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
	label: (<Link to='/beneficiary/beneficiaryCampaigns'>My Campaigns</Link>),
	key: "/beneficiary/beneficiaryCampaigns",
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
label: (<Link to='/donor/donorCampaigns'>My Campaigns</Link>),
key: "/donor/donorCampaigns",
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
    // {
	// 	label: (<Link to='/admin/dashboard'>Dashboard</Link>),
	// 	key: "/admin/dashboard",
	// 	icon: <BarChartOutlined />,
	// },
    {
		label: (<Link to='/admin/campaigns'>Campaigns</Link>),
		key: "/admin/campaigns",
		icon: <EuroOutlined />,
	},
    {
		label: (<Link to='/admin/requests'>Requests</Link>),
		key: "/admin/requests",
		icon: <AuditOutlined />,
	},
    {
		label: (<Link to='/admin/users'>Users</Link>),
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
            : (location.pathname.includes("/campaigns/") ? '/campaigns'
            : (location.pathname.includes("/redeem/") ? '/redeem'
            : (location.pathname.includes("/organizations/") ? '/organizations' : location.pathname))),
    );
    const [disableOverflow, setDisableOverflow] = useState(false);

    // keeps the current updated
    useEffect(() => {
        if (location) {
            if(current !== location.pathname) {
                // A key in the menu is highlighted only if the location is equal to the current value
                let newCurrent = location.pathname
                // When reaching '/campaigns/campaingId' I overwrite the current to highlights Campaigns
                if (location.pathname.includes("/campaigns/")) newCurrent = '/campaigns'
                // same for the redeem
                else if (location.pathname.includes("/redeem/")) newCurrent = '/redeem'
                else if (location.pathname.includes("/organizations/")) newCurrent = '/organizations'
                setCurrent(newCurrent);
            }
        }
    }, [location, current]);

    useEffect(() => {
        // Function to check the window size and update the state
        const handleResize = () => {
            if (window.innerWidth > 900) {
                setDisableOverflow(true);
            } else {
                setDisableOverflow(false);
            }
        };
    
        // Initial check
        handleResize();
    
        // Add event listener for window resize
        window.addEventListener('resize', handleResize);
    
        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // when I click set the right key, might be not needed since the location will change due the Link component
    function handleClick(e) {
        setCurrent(e.key);
    }

    const { role, isUser, isDonor, isBeneficiary, isAdmin } = useAuth()

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
                position: 'sticky',
                top: 0,
                zIndex: 1,
                width: '100%',
				// display: "flex",
				// justifyContent: "space-between",
				// alignItems: "center",
				backgroundColor: "#fff",
				boxShadow: "0 2px 8px #e0e1e2",
			}}
		>
            <Row gutter={10} style={{ width:'100%'}}>
                <Col span={8}>
                    <Space direction="horizontal">
                        {/* <DontaionIcon style={{fontSize: 40, marginRight: 10}} /> */}
                        <Link to="/">
                            <h1 style={{ margin: 0 }}>Ethix</h1>
                        </Link>
                    </Space>
                </Col>
                <Col span={14}>
                {selectedMenu !== null &&
                <Menu
                // disabledOverflow={true}
                onClick={handleClick}
                selectedKeys={[current]}
                mode="horizontal"
                style={{ borderBottom: "none" }}
                items={selectedMenu}
            />}
                </Col>
                <Col span={2}>
                        {role !== null ?
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
                </Col>
            </Row>
		</Header>
	);
};

export default MainHeader;
