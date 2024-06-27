import React from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import MainHeader from "./MainHeader";
const { Header, Content, Footer } = Layout;

const MainLayout = () => {
	return (
		<Layout className="mainLayout">
            <MainHeader />
			<Content>
				<Outlet />
			</Content>
			<Footer>Helo</Footer>
		</Layout>
	);
};

export default MainLayout;
