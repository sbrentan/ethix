import React from "react";
import CampaignsCarousel from "../features/campaigns/CampaignsCarousel";
import { Button, Flex, Image, Space, Timeline, Typography } from "antd";
import { Link } from "react-router-dom";
import {
	ClockCircleOutlined,
	EuroCircleOutlined,
	FileDoneOutlined,
	FormOutlined,
	SearchOutlined,
	ShoppingCartOutlined,
} from "@ant-design/icons";
import "./HomePage.css";

const { Title, Text } = Typography;

const HomePage = () => {
	return (
		<div>
			{/* <Image width={"100%"} src="./img/FoundRaisingAi.jpg" preview={false}>
				Make a Change. Starts now your Charity Campaign
			</Image> */}
			<Flex
				style={{
					minHeight: "500px",
					backgroundImage: "url(/img/FoundRaisingAi.jpg)",
				}}
			>
				<Space direction="vertical" style={{ margin: "20px 20px" }}>
					<Title level={1}>Make a Change</Title>
					<Link to={"/donor/donorCampaigns"}>
						<Button type="primary" shape="round" size="large">
							Start your Charity Campaign Now
						</Button>
					</Link>
				</Space>
			</Flex>
			<CampaignsCarousel />
			{/* <Flex style={{ backgroundColor: "#eeebe4" }}>
				<Space
					direction="vertical"
					style={{ margin: "20px 20px", width: "100%" }}
					align="center"
				>
					<Title level={2}>How it works</Title>
					<Space direction="horizontal">
                    
                    </Space>
				</Space>
			</Flex> */}
			<Flex style={{ backgroundColor: "#eeebe4" }}>
				<Space
					direction="vertical"
					style={{ margin: "20px 20px", width: "100%" }}
					align="center"
				>
					<Title level={2}>Steps to start a Campaign</Title>
					<Space
						direction="horizontal"
						style={{ margin: "20px 20px", width: "100%" }}
						align="start"
						size={30}
					>
						<Space direction="vertical" size={0}>
							<Timeline
								items={[
									{
										children: (
											<Text style={{ fontSize: 16 }}>
												Register as a Donor
											</Text>
										),
										dot: (
											<FormOutlined
												style={{ fontSize: 20 }}
											/>
										),
									},
									{
										children: (
											<Text style={{ fontSize: 16 }}>
												Select the desired Beneficiary
											</Text>
										),
										dot: (
											<SearchOutlined
												style={{ fontSize: 20 }}
											/>
										),
									},
									{
										children: (
											<Text style={{ fontSize: 16 }}>
												Add Campaign Details
											</Text>
										),
										dot: (
											<FileDoneOutlined
												style={{ fontSize: 20 }}
											/>
										),
									},
									// {
									// 	children: (
									// 		<Text style={{ fontSize: 16 }}>
									// 			Waiting for approval
									// 		</Text>
									// 	),
									// 	dot: (
									// 		<ClockCircleOutlined
									// 			style={{ fontSize: 20 }}
									// 		/>
									// 	),
									// },
									{
										children: (
											<Text style={{ fontSize: 16 }}>
												Found the campaign
											</Text>
										),
										dot: (
											<EuroCircleOutlined
												style={{ fontSize: 20 }}
											/>
										),
									},
									{
										children: (
											<Text style={{ fontSize: 16 }}>
												Delivers your product with
												redeemable tokens
											</Text>
										),
										dot: (
											<ShoppingCartOutlined
												style={{ fontSize: 20 }}
											/>
										),
									},
								]}
								style={{ marginTop: 20 }}
							/>
                            <Link to={"/donor/donorCampaigns"}>
                                <Button type="primary" shape="round" size="large">
                                    Start Now
                                </Button>
                            </Link>
						</Space>
						<Image src="https://www.wordstormpr.com.au/wp-content/uploads/2014/07/charity.png" width={350} preview={false} />
					</Space>
				</Space>
			</Flex>
		</div>
	);
};

export default HomePage;
