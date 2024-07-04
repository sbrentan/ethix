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
import RegisterUser from "./RegisterUser";
import RegisterDonor from "./RegisterDonor";
import RegisterBeneficiary from "./RegisterBeneficiary";
import { Link } from "react-router-dom";

const { Text, Title } = Typography;
const Register = () => {
	const [successRegistration, setSuccessRegistration] = useState(false);
	// For the tabs
	const tabItems = [
		{
			key: "0",
			label: "User",
			children: (
				<RegisterUser setSuccessRegistration={setSuccessRegistration} />
			),
		},
		{
			key: "1",
			label: "Donor",
			children: (
				<RegisterDonor
					setSuccessRegistration={setSuccessRegistration}
				/>
			),
		},
		{
			key: "2",
			label: "Beneficiary",
			children: (
				<RegisterBeneficiary
					setSuccessRegistration={setSuccessRegistration}
				/>
			),
		},
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
						{successRegistration ? (
							<Result
								status="success"
								title="Registration completed"
								subTitle="Account created, you can now access to your reserved area! Login to proceed."
								extra={
									<Link to="/login">
										<Button type="primary">Login</Button>
									</Link>
								}
							/>
						) : (
							<>
								<Title>Register</Title>
								<Text>Select the right option to register</Text>

								<Tabs
									defaultActiveKey="0"
									items={tabItems}
									centered
									size={"large"}
								/>
								<hr />
								<div>
									Are you already registered?
									<Link to="/login"> Log in here</Link>
								</div>
							</>
						)}
					</Card>
				</Col>
				<Col span={4} />
			</Row>
		</div>
	);
};

export default Register;
