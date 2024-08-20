import React from "react";
import { Layout } from "antd";

const { Footer } = Layout

const MainFooter = () => {
	return (
		<Footer
			style={{
				textAlign: "center",
			}}
		>
			Ethix © {new Date().getFullYear()}. All Rights Reserved.
		</Footer>
	);
};

export default MainFooter;
