import { Card, Col, Divider, Progress, Row, Space, Typography } from "antd";
import { format } from "date-fns";
import React from "react";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import { useNavigate } from "react-router-dom";
import { useEthPrice } from "use-eth-price";

const { Text } = Typography;

const isExpired = (deadline) => {
	// Convert the date to JS Date
	const expirationDate = new Date(deadline);

	// Get the current date and time
	const now = new Date();

	// Compare the dates
	return now > expirationDate;
};

const CampaignCard = ({ campaignId }) => {
	const { campaign } = useGetCampaignsQuery("campaignsList", {
		selectFromResult: ({ data }) => ({
			campaign: data?.entities[campaignId],
		}),
	});

    const { ethPrice, loading, errorEth } = useEthPrice("eur");
    const navigate = useNavigate()

	if (campaign) {
        let targetEuro = null;
        if (ethPrice) {
            targetEuro = (campaign.targetEur);
        }
    
		let percent = Math.floor(Math.random() * 11) * 10;
        if (campaign && campaign.blockchain_data) {
            try { 
                percent = Math.floor(campaign.blockchain_data.redeemedTokensCount / campaign.blockchain_data.tokensCount * 100)
                console.log(percent)
                if (percent < 1 && campaign.blockchain_data.redeemedTokensCount > 0) percent = 1
            } catch (error) {console.log(error)}
        }

		let status = "active";
		if (percent === 100) {
			status = "";
		} else if (isExpired(campaign.deadline)) {
			status = "exception";
		}
		return (
			<Card title={campaign.title} hoverable onClick={() => navigate(`/campaigns/${campaign.id}`)} style={{ margin: '8px'}}>
				<Text>{campaign.description}</Text>
				<br />
				<Divider type="horizontal" />
				<Row>
					<Col span={6}>
						<Space direction="vertical">
							<Text strong>Starting Date:</Text>
							<Text>
								{format(
									new Date(campaign.createdAt),
									"dd/MM/yyyy"
								)}
							</Text>
						</Space>
					</Col>
					<Col span={1}>
						<Divider
							type="vertical"
							style={{ height: "auto", minHeight: "100%" }}
						/>
					</Col>
					<Col span={10}>
                        <Space direction="vertical" style={{ width: '100%'}}>
						    <Progress percent={percent} status={status} />
                            <Text>
                                Goal of{" "}
                                {targetEuro ? <Text strong>{targetEuro}</Text> : "Calculating Exchange Rate"} €
                            </Text>
                        </Space>
					</Col>
					<Col span={1}>
						<Divider
							type="vertical"
							style={{ height: "auto", minHeight: "100%" }}
						/>
					</Col>
					<Col span={6}>
						<Space direction="vertical">
							<Text strong>Deadline:</Text>
							<Text>
								{format(
									new Date(campaign.deadline),
									"dd/MM/yyyy"
								)}
							</Text>
						</Space>
					</Col>
				</Row>
			</Card>
		);
	} else return null;
};

export default CampaignCard;
