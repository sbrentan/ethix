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
				Campaign name: <input type="text" />
				Campaign name: <input type="text" />
				Campaign name: <input type="text" />
				Campaign name: <input type="text" />
				Campaign name: <input type="text" />
				Campaign name: <input type="text" /><br></br>
				<button>Start</button>
				<button>End</button>
			</Content>
			<Footer>Helo</Footer>
		</Layout>
	);
};

export default MainLayout;
