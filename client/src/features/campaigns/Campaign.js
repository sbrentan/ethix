import NotFoundResult from "../../components/NotFoundResult";
import { Link, useParams } from "react-router-dom";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import { TransactionContext } from "./../../context/TransactionContext";
import React, { useContext } from "react";
import {
	Avatar,
	Card,
	Col,
	Divider,
	Flex,
	Image,
	Progress,
	Row,
	Space,
	Typography,
} from "antd";
import {
	CalendarOutlined,
	CarryOutOutlined,
	EuroCircleOutlined,
	HeartOutlined,
	PlaySquareOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { useGetPublicProfileByUserQuery } from "../requests/requestsApiSlice";
import { useEthPrice } from "use-eth-price";

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

	const { data: profileBeneficiary, profileBeneficiaryLoading } =
		useGetPublicProfileByUserQuery({ userId: campaign?.receiver });
	const { data: profileDonor, profileDonorLoading } =
		useGetPublicProfileByUserQuery({ userId: campaign?.donor });
	const { ethPrice, loading, errorEth } = useEthPrice("eur");

	const { setCampaign } = useContext(TransactionContext);
	console.log(campaign);
	if (!campaign)
		return (
			<>
				<NotFoundResult subTitle="The campaign you are looking for cannot be found" />
			</>
		);
	setCampaign();
	let percent = Math.floor(Math.random() * 11) * 10;

	if (campaign && campaign.blockchain_data) {
		try {
			percent =
				Math.floor(
					campaign.blockchain_data.redeemedTokensCount /
						campaign.blockchain_data.tokensCount
				* 100);
			if (percent < 1 && campaign.blockchain_data.redeemedTokensCount > 0) percent = 1;
		} catch (error) {
			console.log(error);
		}
	}

	let status = "active";
	if (percent === 100) {
		status = "";
	} else if (isExpired(campaign.deadline)) {
		status = "exception";
	}
	console.log(campaign);
	const daysLeft = Math.floor(
		(new Date(campaign.deadline).getTime() -
			new Date(campaign.startingDate).getTime()) /
			(1000 * 60 * 60 * 24)
	);

	let targetEuro = null;
	let currentAmountEuro = null;
	if (ethPrice) {
		targetEuro = (campaign.target * ethPrice).toFixed(2);
		if (campaign.blockchain_data) {
			const valueOfToken = campaign.target / campaign.tokensCount;
			currentAmountEuro = (
				campaign.blockchain_data.redeemedTokensCount *
				valueOfToken *
				ethPrice
			).toFixed(2);
		}
	}

	return (
		<div style={{ margin: 30 }}>
			<Row gutter={10}>
				<Col span={16}>
					<Card>
						<Space direction="vertical">
							<Image
								src={
									campaign?.image ? campaign?.image : "error"
								}
								width={"100%"}
								preview={campaign?.image ? true : false}
							/>
							<Text>
								A fundraising campaign by{" "}
								<Text strong>
									{profileDonor?.publicName ? (
										<Link
											to={`/organizations/${profileDonor._id}`}
										>
											{profileDonor?.publicName}
										</Link>
									) : (
										campaign.donor
									)}
								</Text>
							</Text>
							<Title>{campaign.title}</Title>
							<Text>{campaign.description}</Text>
						</Space>
					</Card>
					{/* <Card>
						<button type="button" id="start" onClick={startCampaign} disabled={!campaign.is_fundable}>Start Campaign</button>
						<button type="button" onClick={() => getCampaignTokens(campaign.address)}>Get campaign tokens</button>
						<button type="button" onClick={() => claimRefund(campaign.address)}>Claim refund</button>
						</Card> */}
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
								<Title level={4} style={{ fontSize: 30 }}>
									<EuroCircleOutlined />{" "}
									{currentAmountEuro
										? currentAmountEuro
										: "Calculating Exchange Rate"}
								</Title>
								<Progress percent={percent} status={status} />
								<Text>
									Raised on a goal of{" "}
									{targetEuro ? targetEuro : "Calculating Exchange Rate"} €
								</Text>
							</Space>
							<Divider />
							<Row>
								<Col span={12}>
									<CalendarOutlined
										style={{ marginRight: 10 }}
									/>
									<Text>Days left</Text>
								</Col>
								<Col span={12}>
									<Text strong>{daysLeft}</Text>
								</Col>
							</Row>
							<Row>
								<Col span={12}>
                                    <PlaySquareOutlined
										style={{ marginRight: 10 }}
									/>
									<Text>Starting Date</Text>
								</Col>
								<Col span={12}>
									<Text strong>
										{format(
											new Date(campaign.startingDate),
											"dd/MM/yyyy"
										)}
									</Text>
								</Col>
							</Row>
							<Row>
								<Col span={12}>
									<CarryOutOutlined
										style={{ marginRight: 10 }}
									/>
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
							<Row>
								<Col span={12}>
									<HeartOutlined
										style={{ marginRight: 10 }}
									/>
									<Text>Donors</Text>
								</Col>
								<Col span={12}>
									<Text strong>
										{
											campaign?.blockchain_data
												?.redeemedTokensCount
										}
									</Text>
								</Col>
							</Row>
						</Card>
                        <Card>
							<Meta
								avatar={<Avatar icon={profileBeneficiary?.publicImage ? <Image src={profileBeneficiary?.publicImage} preview={false} /> : <UserOutlined />} />}
								title={profileBeneficiary?.publicName ? <Link to={`/organizations/${profileBeneficiary._id}`}>{profileBeneficiary.publicName}</Link> : campaign.receiver}
								description={profileBeneficiary?.publicDescription ? profileBeneficiary.publicDescription : "Description of Beneficiary"}
							/>
						</Card>
					</Space>
				</Col>
			</Row>
		</div>
	);
};

export default Campaign;
