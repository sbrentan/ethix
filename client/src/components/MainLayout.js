import React from "react";
import { Layout } from "antd";
import MainHeader from "./MainHeader";
import Test from "./Test";
import { Outlet } from "react-router-dom";
const { Header, Content, Footer } = Layout;

const MainLayout = () => {
	return (
		<Layout className="mainLayout">
            <MainHeader />
			<Content>
				<Outlet />
				<Test />
			</Content>
			<Footer>Helo</Footer>
		</Layout>
	);
};

export default MainLayout;
