import React, { useEffect, useState } from "react";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import {
	Button,
	Col,
	Divider,
	Input,
	message,
	Modal,
	Row,
	Select,
	Space,
	Table,
	Typography,
} from "antd";
import { format } from "date-fns";
import useAuth from "../../hooks/useAuth";
import ClaimModal from "./ClaimModal";
import GenerateTokensModal from "./GenerateTokensModal";
import { useGetPublicProfilesQuery } from "../requests/requestsApiSlice";
import { useEthPrice } from "use-eth-price";

const { Option } = Select;
const { Text, Title } = Typography;

// for the warning: Each child in a list should have a unique "key" prop.
const generateRowKey = (campaign) => {
	// Return a unique identifier for each campaign (e.g., campaign ID)
	return campaign.id;
};

const isExpired = (deadline) => {
	// Convert the date to JS Date
	const expirationDate = new Date(deadline);

	// Get the current date and time
	const now = new Date();

	// Compare the dates
	return now > expirationDate;
};

const DashboardOrganization = ({ role }) => {
	// GET status to check if is Donor or Beneficiary
	const { userId } = useAuth();
	const [titleFilter, setTitleFilter] = useState("");
	const [filteredCampaigns, setFilteredCampaigns] = useState([]);

	// To see the claim donation modal and the Generate Tokens
	const [selectedCampaign, setSelectedCampaign] = useState(null);
	const [showViewModal, setShowViewModal] = useState(false);
	const [showClaimModal, setShowClaimModal] = useState(false);
	const [showGenerateTokensModal, setShowGenerateTokensModal] =
		useState(false);

	// for antd message
	const [messageApi, contextHolder] = message.useMessage();
	const { ethPrice, loading, errorEth } = useEthPrice("eur");

	const {
		data: normalizedCampaigns,
		isLoading,
		isFetching,
		isSuccess,
		isError,
		error,
		refetch,
	} = useGetCampaignsQuery("campaignsList", {});

    const {
		data: normalizedPublicProfiles,
		isSuccess: isProfileSuccess,
	} = useGetPublicProfilesQuery("publicProfilesList", {});

	// When campaigns or the filter change it perform a filters evaluation
	// Filtered result is the ID lists of the filtered campaigns
	useEffect(() => {
		let filteredResult = [];
		if (isSuccess) {
			const { ids, entities } = normalizedCampaigns;
			filteredResult = ids.filter((campaignId) => {
				const campaign = entities[campaignId];

				if (!campaign) return false;

				const titleCondition =
					titleFilter === "" ||
					campaign.title
						.toLowerCase()
						.includes(titleFilter.toLowerCase());

				// const activeCondition =
				// 	activeFilter === "" ||
				// 	(activeFilter === "true" &&
				// 		!isExpired(campaign.deadline)) ||
				// 	(activeFilter === "false" && isExpired(campaign.deadline));

				// TODO: donor and receiver filter
				const donorCondition =
					role !== "Donor" || campaign.donor === userId;
				const receiverConditon =
					role !== "Beneficiary" || campaign.receiver === userId;

				return titleCondition && donorCondition && receiverConditon;
			});
		}
		setFilteredCampaigns(filteredResult);
	}, [normalizedCampaigns, isSuccess, isFetching, titleFilter]);

	// Error Overlay
	useEffect(() => {
		if (isError) {
			messageApi.open({
				key: "error",
				type: "error",
				content: error?.data?.message,
				duration: 5,
			});
		}
	}, [isError, error]);

	// TABLE 1: ONGOING CAMPAIGN
	const activeColumns = [
		{
			title: "Title",
			dataIndex: "title",
			key: "title",
		},
		{
			title: "Donor",
			dataIndex: "donor",
			ellipsis: true,
            render: (action, record) => (record.donorPublicName ? record.donorPublicName : record.donor)
		},
		{
			title: "Beneficiary",
			dataIndex: "receiver",
			ellipsis: true,
            render: (action, record) => (record.receiverPublicName ? record.receiverPublicName : record.receiver)
		},
		{
			title: "Starting Date",
			dataIndex: "startingDate",
			key: "startingDate",
			render: (startingDate) =>
				format(new Date(startingDate), "dd/MM/yyyy"),
		},
		{
			title: "Deadline",
			dataIndex: "deadline",
			key: "deadline",
			render: (deadline) => format(new Date(deadline), "dd/MM/yyyy"),
		},
		{
			title: "Action",
			dataIndex: "action",
			render: (action, record) => (
				<>
					<Space>
						<Button
							onClick={() => {
								setSelectedCampaign(record);
								setShowViewModal(true);
							}}
						>
							Details
						</Button>
						{role === "Donor" && (
							<Button
								// style={{ background: "#e5e5e5" }}
								type="primary"
								onClick={() => {
									setSelectedCampaign(record);
									setShowGenerateTokensModal(true);
								}}
								disabled={
									record?.blockchain_data?.funded ||
									!record.is_fundable
								}
							>
								Start
							</Button>
						)}
					</Space>
				</>
			),
		},
	];

	// TABLE 2: ENDED CAMPAIGN
	const endedColumns = [
		{
			title: "Title",
			dataIndex: "title",
			key: "title",
		},
		{
			title: "Donor",
			dataIndex: "donor",
			ellipsis: true,
            render: (action, record) => (record.donorPublicName ? record.donorPublicName : record.donor)
        },
		{
			title: "Beneficiary",
			dataIndex: "receiver",
			ellipsis: true,
            render: (action, record) => (record.receiverPublicName ? record.receiverPublicName : record.receiver)
        },
		{
			title: "Starting Date",
			dataIndex: "startingDate",
			key: "startingDate",
			render: (startingDate) =>
				format(new Date(startingDate), "dd/MM/yyyy"),
		},
		{
			title: "Deadline",
			dataIndex: "deadline",
			key: "deadline",
			render: (deadline) => format(new Date(deadline), "dd/MM/yyyy"),
		},
		{
			title: "Action",
			dataIndex: "action",
			render: (action, record) => (
				<Space>
					<Button
						onClick={() => {
							setSelectedCampaign(record);
							setShowViewModal(true);
						}}
					>
						Details
					</Button>
					<Button
						onClick={() => {
							setSelectedCampaign(record);
							setShowClaimModal(true);
						}}
						disabled={
							role === "Donor"
								? record?.blockchain_data?.refundClaimed
								: record?.blockchain_data?.donationClaimed
						}
					>
						{role === "Donor" ? "Claim" : "Claim"}
					</Button>
				</Space>
			),
		},
	];

	let errContent = null;
	let tableSourceActive = null;
	let tableSourceEnded = null;
	let tableContentActive = (
		<Table columns={activeColumns} pagination={false} dataSource={null} />
	);
	let tableContentEnded = (
		<Table columns={endedColumns} pagination={false} dataSource={null} />
	);
	if (isError) {
		errContent = (
			<Text type="danger" strong>
				Error while receiving data: {error?.data?.message}
			</Text>
		);
	} else if (isSuccess) {
		if (filteredCampaigns.length) {
			const { entities } = normalizedCampaigns;
            // tableSourceActive = filteredCampaigns
            //     .map((id) => entities[id])
            //     .filter(
            //         (entity) =>
            //             entity !== undefined && !isExpired(entity.deadline)
            //     );

            // tableSourceEnded = filteredCampaigns
            //     .map((id) => entities[id])
            //     .filter(
            //         (entity) =>
            //             entity !== undefined && isExpired(entity.deadline)
            //     );
                let profiles = []
                if (isProfileSuccess && normalizedPublicProfiles?.entities) {
                    const { ids, entities: entitiesProfiles } = normalizedPublicProfiles
                    profiles = ids.map((id) => entitiesProfiles[id])
                }
                const { tableSourceActiveRed, tableSourceEndedRed } = filteredCampaigns.reduce(
                    (result, id) => {
                        const entity = entities[id];
                        if (entity !== undefined) {
                            let donorPublicName = null
                            let receiverPublicName = null
                            donorPublicName = profiles.find((profile) => profile.user === entity.donor)?.publicName
                            receiverPublicName = profiles.find((profile) => profile.user === entity.receiver)?.publicName
                            
                            if (isExpired(entity.deadline)) {
                                result.tableSourceEndedRed.push({...entity, donorPublicName, receiverPublicName});
                            } else {
                                result.tableSourceActiveRed.push({...entity, donorPublicName, receiverPublicName});
                            }
                        }
                        return result;
                    },
                    { tableSourceActiveRed: [], tableSourceEndedRed: [] }
                );
                tableSourceActive = tableSourceActiveRed
                tableSourceEnded = tableSourceEndedRed
		}

		tableContentActive = (
			<Table
				columns={activeColumns}
				dataSource={tableSourceActive}
				rowKey={generateRowKey}
				pagination={{ pageSize: 5 }}
			/>
		);

		tableContentEnded = (
			<Table
				columns={endedColumns}
				dataSource={tableSourceEnded}
				rowKey={generateRowKey}
				pagination={{ pageSize: 5 }}
			/>
		);
	}

    let targetEuro = null;
	let valueOfToken = null;
    let codesNotRedeemed = null
    if (selectedCampaign){
	if (ethPrice) {
		targetEuro = (selectedCampaign.targetEur);
        valueOfToken = ((selectedCampaign.target / selectedCampaign.tokensCount)* ethPrice).toFixed(2);
	}
    if (selectedCampaign.blockchain_data) {
        codesNotRedeemed = selectedCampaign.blockchain_data.tokensCount - selectedCampaign.blockchain_data.redeemedTokensCount
    }}

	return (
		<div style={{ margin: 20 }}>
			{contextHolder}
			<Space>
				<Title level={3}>Ongoing Campaigns</Title>
			</Space>
			{role === "Donor" && (
				<>
					<br />
					<Text>
						Click Details below to check see information or to fund
						a campaign
					</Text>
				</>
			)}
			<div style={{ marginTop: 10 }}>{tableContentActive}</div>
			<Divider />
			<Space>
				<Title level={3}>Ended Campaigns</Title>
			</Space>
			<div style={{ marginTop: 10 }}>{tableContentEnded}</div>
			{showViewModal && selectedCampaign && (
				<Modal
					onCancel={() => {
						setShowViewModal(false);
						setSelectedCampaign(null);
					}}
					open={showViewModal}
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
							<Text>{selectedCampaign.title}</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Description:</Text>
						</Col>
						<Col span={12}>
							<Text>{selectedCampaign.description}</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Donor:</Text>
						</Col>
						<Col span={12}>
							<Text strong={role === "Donor"}>
								{selectedCampaign.donorPublicName ? selectedCampaign.donorPublicName : selectedCampaign.donor}
							</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Beneficiary:</Text>
						</Col>
						<Col span={12}>
							<Text strong={role === "Beneficiary"}>
								{selectedCampaign.receiverPublicName ? selectedCampaign.receiverPublicName : selectedCampaign.receiver}
							</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Starting Date:</Text>
						</Col>
						<Col span={12}>
							<Text>
								{format(
									new Date(selectedCampaign.startingDate),
									"dd/MM/yyyy HH:mm"
								)}
							</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Deadline:</Text>
						</Col>
						<Col span={12}>
							<Text>
								{format(
									new Date(selectedCampaign.deadline),
									"dd/MM/yyyy HH:mm"
								)}
							</Text>
						</Col>
					</Row>
                    {selectedCampaign.blockchain_data && (
                    <>
                        <Row>
                            <Col span={12}>
                                <Text strong>Number of redeemable Codes:</Text>
                            </Col>
                            <Col span={12}>
                                <Text>{selectedCampaign.blockchain_data.tokensCount.toString()}</Text>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col span={12}>
                                <Text strong>Number of Donations:</Text>
                            </Col>
                            <Col span={12}>
                                <Text>{selectedCampaign.blockchain_data.redeemedTokensCount.toString()}</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Text strong>Amount of Donations (ETH):</Text>
                            </Col>
                            <Col span={12}>
                                <Text>
                                    {ethPrice
                                        ? ((selectedCampaign.blockchain_data.redeemedTokensCount * valueOfToken) / ethPrice).toFixed(2)
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
                                        ? (selectedCampaign.blockchain_data.redeemedTokensCount * valueOfToken).toFixed(2)
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
                    </>)}
				</Modal>
			)}
			{showClaimModal && selectedCampaign && (
				<ClaimModal
					role={role}
					campaign={selectedCampaign}
					setSelectedCampaign={setSelectedCampaign}
					showModal={showClaimModal}
					setShowModal={setShowClaimModal}
					messageApi={messageApi}
					refetch={refetch}
				/>
			)}
			{showGenerateTokensModal && selectedCampaign && (
				<GenerateTokensModal
					campaign={selectedCampaign}
					setSelectedCampaign={setSelectedCampaign}
					showModal={showGenerateTokensModal}
					setShowModal={setShowGenerateTokensModal}
					messageApi={messageApi}
					refetch={refetch}
				/>
			)}
		</div>
	);
};

export default DashboardOrganization;
