import React, { useEffect, useState } from "react";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import {
	Button,
	Col,
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

const CampaignsList = () => {
	// state and filters
	const [titleFilter, setTitleFilter] = useState("");
	const [donorFilter, setDonorFilter] = useState("");
	const [receiverFilter, setReceiverFilter] = useState("");
	const [activeFilter, setActiveFilter] = useState("");
	const [filteredCampaigns, setFilteredCampaigns] = useState([]);

	// To see the selected campaing
	const [selectedCampaign, setSelectedCampaign] = useState(null);
	const [showViewModal, setShowViewModal] = useState(false);

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
	// Filtered result is the ID lists of the filtered bookings
	useEffect(() => {
		let filteredResult = [];
		if (isSuccess) {
			const { ids, entities } = normalizedCampaigns;
			filteredResult = ids.filter((campaignId) => {
				const campaign = entities[campaignId];

				const titleCondition =
					titleFilter === "" ||
					campaign.title
						.toLowerCase()
						.includes(titleFilter.toLowerCase());

				const activeCondition =
					activeFilter === "" ||
					(activeFilter === "true" &&
						!isExpired(campaign.deadline)) ||
					(activeFilter === "false" && isExpired(campaign.deadline));

				// TODO: donor and receiver filter

				return titleCondition && activeCondition;
			});
		}
		setFilteredCampaigns(filteredResult);
	}, [
		normalizedCampaigns,
		isSuccess,
		isFetching,
		titleFilter,
		activeFilter,
		donorFilter,
		receiverFilter,
	]);

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

	// Columns of the Table
	const columns = [
		{
			title: "Title",
			dataIndex: "title",
			key: "title",
		},
		{
			title: "Description",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
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
						setShowViewModal(true);
					}}
				>
					View Request
				</Button>
			),
		},
	];

	let errContent = null;
	let tableSource = null;
	let tableContent = (
		<Table columns={columns} pagination={false} dataSource={tableSource} />
	);
	if (isError) {
		errContent = (
			<Text type="danger" strong>
				Errore nella ricezione dei dati: {error?.data?.message}
			</Text>
		);
		//if (!preventPolling) setPreventPolling(true)
	} else if (isSuccess) {
		//if (preventPolling) setPreventPolling(false)
		if (filteredCampaigns.length) {
			const { entities } = normalizedCampaigns;
			tableSource = filteredCampaigns
				.map((campaignId) => entities[campaignId])
				.filter((entity) => entity !== undefined);
		}

		tableContent = (
			<Table
				columns={columns}
				dataSource={tableSource}
				rowKey={generateRowKey}
				pagination={filteredCampaigns.length < 100 ? false : true}
			/>
		);
	}

	return (
		<div>
			{contextHolder}
			<Space direction="horizontal">
				<Title>Campaigns</Title>
			</Space>
			<div>
				{/*	FILTERS SECTION */}
				<Row>
					<Col span={5}>
						<Input
							name="titleFilter"
							type="text"
							placeholder="Title"
							value={titleFilter}
							onChange={(e) => setTitleFilter(e.target.value)}
						/>
					</Col>
					<Col span={5}>
						<Select
							showSearch
							name="donorFilter"
							placeholder={"Donor"}
							defaultActiveFirstOption={false}
							style={{ display: "flex" }}
							filterOption={false}
							// onSearch={handleSearch}
							// onChange={handleChange}
							notFoundContent={null}
							// options={(data || []).map((d) => ({
							// 	value: d.value,
							// 	label: d.text,
							// }))}
							disabled
						/>
					</Col>
					<Col span={5}>
						<Select
							showSearch
							name="receiverFilter"
							placeholder={"Beneficiary"}
							defaultActiveFirstOption={false}
							style={{ display: "flex" }}
							filterOption={false}
							// onSearch={handleSearch}
							// onChange={handleChange}
							notFoundContent={null}
							// options={(data || []).map((d) => ({
							// 	value: d.value,
							// 	label: d.text,
							// }))}
							disabled
						/>
					</Col>
					<Col span={5}>
						<Select
							mode="single"
							style={{ display: "flex" }}
							name="activeFilter"
							value={activeFilter}
							onChange={(option) => setActiveFilter(option)}
						>
							<Option value="" key="disabled" disabled>
								Select an option
							</Option>
							<Option value="true" key="active">
								Active
							</Option>
							<Option value="false" key="expired">
								Expired
							</Option>
						</Select>
					</Col>
					<Col span={4}>
						<Button
							onClick={() => {
								setTitleFilter("");
								setActiveFilter("");
							}}
						>
							Remove Filters
						</Button>
					</Col>
				</Row>
			</div>
			{errContent}
			<div>{tableContent}</div>
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
					title={"Campaign Details"}
					cancelText={"Close"}
					okButtonProps={{ style: { display: "none" } }}
				>
					<Row>
						<Col span={12}>
							<Text strong>
								Title:
							</Text>
						</Col>
						<Col span={12}>
                            <Text>{selectedCampaign.title}</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>
								Description:
							</Text>
						</Col>
						<Col span={12}>
                            <Text>{selectedCampaign.description}</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>
								Donor:
							</Text>
						</Col>
						<Col span={12}>
                            <Text>{selectedCampaign.donor}</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>
								Beneficiary:
							</Text>
						</Col>
						<Col span={12}>
                            <Text>{selectedCampaign.receiver}</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>
								Creation Date:
							</Text>
						</Col>
						<Col span={12}>
                            <Text>{format(new Date(selectedCampaign.createdAt), "dd/MM/yyyy")}</Text>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Text strong>
								Deadline:
							</Text>
						</Col>
						<Col span={12}>
                            <Text>{format(new Date(selectedCampaign.deadline), "dd/MM/yyyy")}</Text>
						</Col>
					</Row>
				</Modal>
			)}
		</div>
	);
};

export default CampaignsList;
