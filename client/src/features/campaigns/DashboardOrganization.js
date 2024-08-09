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

	const {
		data: normalizedCampaigns,
		isLoading,
		isFetching,
		isSuccess,
		isError,
		error,
	} = useGetCampaignsQuery("campaignsList", {});

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
			key: "donor",
			ellipsis: true,
		},
		{
			title: "Beneficiary",
			dataIndex: "receiver",
			key: "receiver",
			ellipsis: true,
		},
		{
			title: "Creation Date",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (createdAt) => format(new Date(createdAt), "dd/MM/yyyy"),
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
								style={{ background: "#e5e5e5" }}
								onClick={() => {
									setSelectedCampaign(record);
									setShowGenerateTokensModal(true);
								}}
							>
								Generate Tokens
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
			key: "donor",
			ellipsis: true,
		},
		{
			title: "Beneficiary",
			dataIndex: "receiver",
			key: "receiver",
			ellipsis: true,
		},
		{
			title: "Creation Date",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (createdAt) => format(new Date(createdAt), "dd/MM/yyyy"),
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
				<Button
					onClick={() => {
						setSelectedCampaign(record);
						setShowClaimModal(true);
					}}
				>
					{role === "Donor" ? "Claim Refund" : "Claim Donations"}
				</Button>
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
			tableSourceActive = filteredCampaigns
				.map((id) => entities[id])
				.filter(
					(entity) =>
						entity !== undefined && !isExpired(entity.deadline)
				);

			tableSourceEnded = filteredCampaigns
				.map((id) => entities[id])
				.filter(
					(entity) =>
						entity !== undefined && isExpired(entity.deadline)
				);
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
								{selectedCampaign.donor}
							</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Beneficiary:</Text>
						</Col>
						<Col span={12}>
							<Text strong={role === "Beneficiary"}>
								{selectedCampaign.receiver}
							</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>Creation Date:</Text>
						</Col>
						<Col span={12}>
							<Text>
								{format(
									new Date(selectedCampaign.createdAt),
									"dd/MM/yyyy"
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
									"dd/MM/yyyy"
								)}
							</Text>
						</Col>
					</Row>
				</Modal>
			)}
			{showClaimModal && selectedCampaign && (
				<ClaimModal
					role={role}
					campaign={selectedCampaign}
					setSelectedCampaign={setSelectedCampaign}
					showModal={showClaimModal}
					setShowModal={setShowClaimModal}
				/>
			)}
			{showGenerateTokensModal && selectedCampaign && (
				<GenerateTokensModal
					campaign={selectedCampaign}
					setSelectedCampaign={setSelectedCampaign}
					showModal={showGenerateTokensModal}
					setShowModal={setShowGenerateTokensModal}
				/>
			)}
		</div>
	);
};

export default DashboardOrganization;
