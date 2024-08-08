import { Card, Space, Tabs, Typography } from "antd";
import React from "react";
import MyProfileRequest from "../requests/MyProfileRequest";
import useAuth from "../../hooks/useAuth";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { useGetMyProfileRequestsQuery } from "../requests/requestsApiSlice";
import MyPublicProfile from "./MyPublicProfile";

const { Text, Title } = Typography;

const MyProfile = () => {
	const { verified } = useAuth();

	const tabItems = [
		{
			key: "0",
			label: "Public Data",
			children: <MyPublicProfile />,
		},
		{
			key: "1",
			label: "Private Data",
			children: <MyProfileRequest />,
		},
	];

	const description = (
		<Text>
			{verified
				? "Your account has been verified."
				: "Your account is not yet verified. Check your private profile request below."}
		</Text>
	);

	return (
		<div style={{ margin: "1rem" }}>
			<Card
				style={{
					width: "100%",
				}}
				size={"large"}
			>
				<Space direction="horizontal">
					<Title>Profile</Title>
					{verified && (
						<CheckCircleTwoTone style={{ fontSize: "150%" }} />
					)}
				</Space>
				<br />
				{description}
				<Tabs
					defaultActiveKey="0"
					items={tabItems}
					centered
					size={"large"}
				/>
			</Card>
		</div>
	);
};

export default MyProfile;
