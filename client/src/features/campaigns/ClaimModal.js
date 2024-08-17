import {
	Button,
	Col,
	Divider,
	message,
	Modal,
	Row,
	Space,
	Typography,
} from "antd";
import React, { useContext, useEffect, useState } from "react";
import { TransactionContext } from "../../context/TransactionContext";
import { useEthPrice } from "use-eth-price";

const { Text, Title } = Typography;

const ClaimModal = ({
	role,
	campaign,
	setSelectedCampaign,
	showModal,
	setShowModal,
    messageApi,
    refetch
}) => {
	const [campaignBlock, setCampaignBlock] = useState(null);
	const { ethPrice, loading, errorEth } = useEthPrice("eur");

	//  ------ THIS BLOCK CAN BE REMOVED IF THE DATA OF THE CAMPAIGN FROM THE DB ARE INTEGRATED WITH THE DATA FROM BLOCKCAHIN ----//
	// ------- you will still need to swap all campaignBlock with campaign in the return to display the data ---------------------//
	const { claimRefund, claimDonation } =
		useContext(TransactionContext);

	// useEffect(() => {
	// 	async function fetchDataOnBlockChain(campaign) {
	// 		console.log("A");
	// 		console.log(campaign);
	// 		if (campaign && campaign.campaignId) {
	// 			console.log("B");
	// 			const campaignFromBlockchain = await getCampaign(
	// 				campaign.campaignId
	// 			);
	// 			if (!campaignFromBlockchain) {
	// 				messageApi.open({
	// 					key: "error",
	// 					type: "error",
	// 					content: "Error in retrieving the blockchain",
	// 					duration: 5,
	// 				});
	// 			} else {
	// 				setCampaignBlock(campaignFromBlockchain);
	// 			}
	// 			console.log("C");
	// 		}
	// 		console.log("D");
	// 	}
	// 	fetchDataOnBlockChain(campaign);
	// }, [campaign]);
	// --------------------------------------------------------------------------------------------------------------------------- //

	const onClickClaimRefund = async () => {
		try {
			if (!campaign || !campaign.campaignId)
				throw new Error("Missing required data");
			const amountClaimed = await claimRefund(campaign.campaignId);
			if (!amountClaimed || amountClaimed === 0) {
				messageApi.open({
					key: "error",
					type: "error",
					content: "Error when claiming the Refund",
					duration: 5,
				});
			} else {
				messageApi.open({
					key: "success",
					type: "success",
					content: `Refund has been successfully claimed`,
					duration: 5,
				});
				setShowModal(false);
				setSelectedCampaign(null);
                refetch()
			}
		} catch (error) {
			let errorMessage = error.data
				? error.data.message
				: error.message || error;
			messageApi.open({
				key: "error",
				type: "error",
				content: errorMessage,
				duration: 5,
			});
		}
	};

	const onClickClaimDonation = async () => {
		try {
			if (!campaign || !campaign.campaignId)
				throw new Error("Missing required data");
			const amountClaimed = await claimDonation(campaign.campaignId);
			if (!amountClaimed || amountClaimed === 0) {
				messageApi.open({
					key: "error",
					type: "error",
					content: "Error when claiming the Donation",
					duration: 5,
				});
			} else {
				messageApi.open({
					key: "success",
					type: "success",
					content: `Donation has been successfully claimed`,
					duration: 5,
				});
				setShowModal(false);
				setSelectedCampaign(null);
                refetch()
			}
		} catch (error) {
			let errorMessage = error.data
				? error.data.message
				: error.message || error;
			messageApi.open({
				key: "error",
				type: "error",
				content: errorMessage,
				duration: 5,
			});
		}
	};

    let targetEuro = null;
	let valueOfToken = null;
    let codesNotRedeemed = null
	if (ethPrice) {
		targetEuro = (campaign.target * ethPrice).toFixed(2);
        valueOfToken = ((campaign.target / campaign.tokensCount)* ethPrice).toFixed(2);
	}
    if (campaign.blockchain_data) {
        codesNotRedeemed = campaign.blockchain_data.tokensCount - campaign.blockchain_data.redeemedTokensCount
    }

	return (
		<Modal
			onCancel={() => {
				setShowModal(false);
				setSelectedCampaign(null);
			}}
			open={showModal}
			width={1000}
			centered
			style={{ marginTop: "50px", marginBottom: "50px" }}
			title={<Title level={4}>Campaign Details</Title>}
			cancelText={"Close"}
			okButtonProps={{ style: { display: "none" } }}
		>
			<Row>
				<Col span={12}>
					<Text strong>Title:</Text>
				</Col>
				<Col span={12}>
					<Text>{campaign.title}</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Description:</Text>
				</Col>
				<Col span={12}>
					<Text>{campaign.description}</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Donor:</Text>
				</Col>
				<Col span={12}>
					<Text strong={role === "Donor"}>{campaign.donorPublicName ? campaign.donorPublicName : campaign.donor}</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Beneficiary:</Text>
				</Col>
				<Col span={12}>
					<Text strong={role === "Beneficiary"}>
						{campaign.receiverPublicName ? campaign.receiverPublicName : campaign.receiver}
					</Text>
				</Col>
			</Row>
			<Divider />
			<Title level={4}>
				{role === "Donor" ? "Refund Summary" : "Donations Summary"}
			</Title>
			<Row>
				<Col span={12}>
					<Text strong>Max Amount Donation (ETH):</Text>
				</Col>
				<Col span={12}>
					<Text>{campaign.target}</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Max Amount Donation (EUR):</Text>
				</Col>
				<Col span={12}>
					<Text>
						{ethPrice
							? (campaign.target * ethPrice).toFixed(2)
							: "Calculating Exchange Rate"}
					</Text>
				</Col>
			</Row>
			{campaign.blockchain_data && (
				<>
					<Row>
						<Col span={12}>
							<Text strong>Number of redeemable Codes:</Text>
						</Col>
						<Col span={12}>
							<Text>{campaign.blockchain_data.tokensCount.toString()}</Text>
						</Col>
					</Row>
					<br />
					<Row>
						<Col span={12}>
							<Text strong>Number of Donations:</Text>
						</Col>
						<Col span={12}>
							<Text>{campaign.blockchain_data.redeemedTokensCount.toString()}</Text>
						</Col>
					</Row>
                    <Row>
						<Col span={12}>
							<Text strong>Amount of Donations (ETH):</Text>
						</Col>
						<Col span={12}>
							<Text>
								{ethPrice
									? ((campaign.blockchain_data.redeemedTokensCount * valueOfToken) / ethPrice).toFixed(2)
									: "Calculating Exchange Rate"}
							</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Amount of Donations (EUR):</Text>
						</Col>
						<Col span={12}>
							<Text>
								{ethPrice
									? (campaign.blockchain_data.redeemedTokensCount * valueOfToken).toFixed(2)
									: "Calculating Exchange Rate"}
							</Text>
						</Col>
					</Row>
					{role === "Donor" && (
						<>
							<br />
							<Row>
								<Col span={12}>
									<Text strong>Codes Not Redeemd:</Text>
								</Col>
								<Col span={12}>
									<Text>
										{codesNotRedeemed}
									</Text>
								</Col>
							</Row>
							<Row>
								<Col span={12}>
									<Text strong>Refund available (ETH):</Text>
								</Col>
								<Col span={12}>
									<Text>
										{ethPrice
											? (valueOfToken * codesNotRedeemed) / ethPrice
											: "Calculating Exchange Rate"}
									</Text>
								</Col>
							</Row>
							<Row>
								<Col span={12}>
									<Text strong>Refund available (EUR):</Text>
								</Col>
								<Col span={12}>
									<Text>
										{ethPrice
											? (valueOfToken * codesNotRedeemed).toFixed(2)
											: "Calculating Exchange Rate"}
									</Text>
								</Col>
							</Row>
						</>
					)}
					<div
						style={{
							textAlign: "center",
							margin: "auto",
							width: "50%",
							paddingTop: 20,
						}}
					>
						{role === "Donor" ? (
							<Space direction="vertical">
								<Button
									type="primary"
									size="large"
									disabled={campaign.blockchain_data.redeemedTokensCount === campaign.blockchain_data.tokensCount}
									onClick={() => onClickClaimRefund()}
								>
									Claim Refund
								</Button>
								{campaign.blockchain_data.redeemedTokensCount === campaign.blockchain_data.tokensCount && (
									<Text type="danger">
										Unfortunately there is no refund available
									</Text>
								)} 
							</Space>
						) : (
							<Space direction="vertical">
								<Button
									type="primary"
									size="large"
									disabled={
										campaign.blockchain_data.redeemedTokensCount === 0
									}
									onClick={() => onClickClaimDonation()}
								>
									Claim Dontations
								</Button>
								{campaign.blockchain_data.redeemedTokensCount === 0 && (
									<Text type="danger">
										Unfortunately no donations has been made
									</Text>
								)}
							</Space>
						)}
					</div>
				</>
			)}
		</Modal>
	);
};

export default ClaimModal;
