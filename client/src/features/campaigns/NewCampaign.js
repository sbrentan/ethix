import {
	Button,
	Card,
	Col,
	Result,
	Row,
	Tabs,
	Typography,
	message,
} from "antd";
import React, { useEffect, useState } from "react";
import CreateCampaign from "./CreateCampaign.js";
import { Link } from "react-router-dom";

const { Text, Title } = Typography;
const NewCampaign = () => {
	const [successCreation, setSuccessCreation] = useState(false);
	// For the tabs
	const tabItems = [
		{
			key: "0",
			label: "Campaign",
			children: (
				<CreateCampaign setSuccessCreation={setSuccessCreation} />
			),
		}
	];
	return (
		<div>
			<Row style={{ marginTop: 20 }}>
				<Col span={4} />
				<Col span={16}>
					<Card
						style={{
							width: "100%",
						}}
						size={"large"}
					>
						{successCreation ? (
							<Result
								status="success"
								title="Creation successful"
								subTitle="Campaign created, you can now find it in your campaigns!."
								extra={
									<Link to="/donor/donorCampaigns">
										<Button type="primary">My Campaigns</Button>
									</Link>
								}
							/>
						) : (
							<>
								<Title>New Campaign</Title>
								<Text>Compile data to create a new Campaign</Text>

								<Tabs
									defaultActiveKey="0"
									items={tabItems}
									centered
									size={"large"}
								/>
							</>
						)}
					</Card>
				</Col>
				<Col span={4} />
			</Row>
		</div>
	);
};

export default NewCampaign;
