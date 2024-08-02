import React from "react";
import NotFoundResult from "../../components/NotFoundResult";
import { useParams } from "react-router-dom";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import {
	Avatar,
	Card,
	Col,
	Divider,
	Image,
	Progress,
	Row,
	Space,
	Typography,
} from "antd";
import { EuroCircleOutlined, UserOutlined } from "@ant-design/icons";
import { format } from "date-fns";

const { Text, Title } = Typography;
const { Meta } = Card;

const isExpired = (deadline) => {
	// Convert the date to JS Date
	const expirationDate = new Date(deadline);

	// Get the current date and time
	const now = new Date();

	// Compare the dates
	return now > expirationDate;
};

const Campaign = () => {
	// id campaign
	const { id } = useParams();

	const { campaign, isCampaignLoading } = useGetCampaignsQuery(
		"campaignsList",
		{
			selectFromResult: ({ data }) => ({
				campaign: data?.entities[id],
			}),
		}
	);

	if (!campaign)
		return (
			<>
				<NotFoundResult subTitle="The campaign you are looking for cannot be found" />
			</>
		);

	const percent = Math.floor(Math.random() * 11) * 10;
	let status = "active";
	if (percent === 100) {
		status = "";
	} else if (isExpired(campaign.deadline)) {
		status = "exception";
	}
	const daysLeft = Math.floor(
		(new Date(campaign.deadline).getTime() -
			new Date(campaign.createdAt).getTime()) /
			(1000 * 60 * 60 * 24)
	);
	return (
		<div style={{ margin: 30 }}>
			<Row gutter={10}>
				<Col span={16}>
					<Card>
						<Space direction="vertical">
							<Image width={200} src="error" preview={false} />
							<Text>
								A fundraising campaign by{" "}
								<Text strong>{campaign.donor}</Text>
							</Text>
							<Title>{campaign.title}</Title>
							<Text>{campaign.description}</Text>
						</Space>
					</Card>
				</Col>
				<Col span={8}>
					<Space
						size={10}
						direction="vertical"
						style={{ display: "flex", height: "100%" }}
					>
						<Card>
							<Space
								direction="vertical"
								style={{ display: "flex" }}
							>
								<Title level={4}>
									<EuroCircleOutlined /> Amount
								</Title>
								<Progress percent={percent} status={status} />
							</Space>
							<Divider />
							<Row>
								<Col span={12}>
									<Text>Days left</Text>
								</Col>
								<Col span={12}>
									<Text strong>{daysLeft}</Text>
								</Col>
							</Row>
							<Row>
								<Col span={12}>
									<Text>Starting Date</Text>
								</Col>
								<Col span={12}>
									<Text strong>
										{format(
											new Date(campaign.createdAt),
											"dd/MM/yyyy"
										)}
									</Text>
								</Col>
							</Row>
							<Row>
								<Col span={12}>
									<Text>Deadline</Text>
								</Col>
								<Col span={12}>
									<Text strong>
										{format(
											new Date(campaign.deadline),
											"dd/MM/yyyy"
										)}
									</Text>
								</Col>
							</Row>
						</Card>
						<Card>
							<Meta
								avatar={<Avatar icon={<UserOutlined />} />}
								title={campaign.receiver}
								description="Description of beneficiary"
							/>
						</Card>
					</Space>
				</Col>
			</Row>
		</div>
	);
};

export default Campaign;
