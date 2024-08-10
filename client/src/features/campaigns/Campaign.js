import NotFoundResult from "../../components/NotFoundResult";
import { Link, useParams } from "react-router-dom";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import { TransactionContext } from "./../../context/TransactionContext";
import React, {  useContext } from "react";
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
import { EuroCircleOutlined, UserOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { useGetPublicProfileByUserQuery } from "../requests/requestsApiSlice";

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

	const { campaignDB, isCampaignLoading } = useGetCampaignsQuery(
		"campaignsList",
		{
			selectFromResult: ({ data }) => ({
				campaignDB: data?.entities[id],
			}),
		}
	);

	const { data: profileBeneficiary, profileBeneficiaryLoading } = useGetPublicProfileByUserQuery({userId: campaignDB?.receiver })
	const { data: profileDonor, profileDonorLoading } = useGetPublicProfileByUserQuery({userId: campaignDB?.donor })
	
  const {
		campaign,
    startCampaign,
		setCampaign,
		getCampaignTokens,
		claimRefund,
  } = useContext(TransactionContext);
	console.log(campaignDB)
	if (!campaignDB)
		return (
			<>
				<NotFoundResult subTitle="The campaignDB you are looking for cannot be found" />
			</>
		);
		setCampaign()
	const percent = Math.floor(Math.random() * 11) * 10;
	let status = "active";
	if (percent === 100) {
		status = "";
	} else if (isExpired(campaignDB.deadline)) {
		status = "exception";
	}
	console.log(campaign)
	const daysLeft = Math.floor(
		(new Date(campaignDB.deadline).getTime() -
			new Date(campaignDB.startingDate).getTime()) /
			(1000 * 60 * 60 * 24)
	);
	return (
		<div style={{ margin: 30 }}>
			<Row gutter={10}>
				<Col span={16}>
					<Card>
						<Space direction="vertical">
                            <Image
								src={campaignDB?.image ? campaignDB?.image : "error"}
								width={'100%'}
								preview={campaignDB?.image ? true : false}
							/>
							<Text>
								A fundraising campaign by{" "}
								<Text strong>{profileDonor?.publicName ? <Link to={`/organizations/${profileDonor._id}`}>{profileDonor?.publicName}</Link> : campaignDB.donor}</Text>
							</Text>
							<Title>{campaignDB.title}</Title>
							<Text>{campaignDB.description}</Text>
						</Space>
					</Card>
						<Card>
						{/* <button type="button" id="start" onClick={startCampaign} disabled={!campaignDB.is_fundable}>Start Campaign</button>
						<button type="button" onClick={() => getCampaignTokens(campaign.address)}>Get campaignDB tokens</button>
						<button type="button" onClick={() => claimRefund(campaign.address)}>Claim refund</button> */}
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
											new Date(campaignDB.startingDate),
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
											new Date(campaignDB.deadline),
											"dd/MM/yyyy"
										)}
									</Text>
								</Col>
							</Row>
						</Card>
						<Card>
							<Meta
								avatar={<Avatar icon={profileBeneficiary?.publicImage ? <Image src={profileBeneficiary?.publicImage} preview={false} /> : <UserOutlined />} />}
								title={profileBeneficiary?.publicName ? <Link to={`/organizations/${profileBeneficiary._id}`}>{profileBeneficiary.publicName}</Link> : campaignDB.receiver}
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
