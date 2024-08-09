import {
	Button,
	Col,
	Divider,
	Flex,
	List,
	message,
	Modal,
	Row,
	Space,
	Typography,
} from "antd";
import { format } from "date-fns";
import React, { useContext, useEffect, useState } from "react";
import { TransactionContext } from "../../context/TransactionContext";
import ExcelJS from "exceljs";

const { Text, Title } = Typography;

const isExpired = (deadline) => {
	// Convert the date to JS Date
	const expirationDate = new Date(deadline);

	// Get the current date and time
	const now = new Date();

	// Compare the dates
	return now > expirationDate;
};

const GenerateTokensModal = ({
	campaign,
	setSelectedCampaign,
	showModal,
	setShowModal,
	messageApi,
}) => {
	const [tokensList, setTokensList] = useState([]);

	const { startCampaign } = useContext(TransactionContext);

	const exportToExcel = () => {
		if (!Array.isArray(tokensList) || !tokensList.length) {
			return messageApi.open({
				key: "error",
				type: "error",
				content: "Nessun dato disponibile da scaricare",
				duration: 5,
			});
		}

		// Create a new workbook
		const workbook = new ExcelJS.Workbook();

		// Add a worksheet
		const worksheet = workbook.addWorksheet("Redeemable Codes");

		// if is not a JWT,
		// worksheet.columns = [
		//     { header: '#', key: 'nr', width: 5 },
		//     { header: 'TOKEN', key: 'token', width: 100 },
		//     { header: 'SIGNATURE', key: 'signature', width: 100 },
		// ]
		// If IS a JWT
		worksheet.columns = [
			{ header: "#", key: "nr", width: 5 },
			{ header: "TOKEN", key: "token", width: 300 },
		];

		tokensList.forEach((token, index) => {
			worksheet.addRow({
				...token,
			});
		});

		const columnA = worksheet.getColumn("A");
		columnA.font = { name: "Calibri", bold: true };
		columnA.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "ffff99" },
		};
		columnA.alignment = { horizontal: "center" };
		columnA.border = {
			top: { style: "thin", color: { argb: "000000" } },
			left: { style: "thin", color: { argb: "000000" } },
			bottom: { style: "thin", color: { argb: "000000" } },
			right: { style: "thin", color: { argb: "000000" } },
		};

		// Apply formatting to an entire row
		const row = worksheet.getRow(1);
		row.font = { name: "Calibri", bold: true };
		row.border = {
			top: { style: "thin", color: { argb: "000000" } },
			left: { style: "thin", color: { argb: "000000" } },
			bottom: { style: "thin", color: { argb: "000000" } },
			right: { style: "thin", color: { argb: "000000" } },
		};
		row.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "ff8080" },
		};

		// Create a Blob from the workbook data
		// Save the workbook or perform other operations

		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			// Create a URL for the blob
			const url = URL.createObjectURL(blob);

			// Create a link element to trigger the download
			const a = document.createElement("a");
			a.href = url;
			a.download = `redeemableCodes_Campaign_${campaign.title}.xlsx`;
			a.click();

			// Revoke the URL to free up memory
			URL.revokeObjectURL(url);

			setTokensList([]);
			setShowModal(false);
			setSelectedCampaign(null);
		});
	};

	const handleStart = async () => {
		console.log(campaign);
		const returnedTokens = await startCampaign({
			campaignId: campaign.id,
			campaignAddress: campaign.campaignId,
		});
		if (
			!returnedTokens ||
			!Array.isArray(returnedTokens) ||
			returnedTokens.length < 1
		) {
			messageApi.open({
				key: "error",
				type: "error",
				content: "Something went wrong!",
				duration: 5,
			});
		} else {
			setTokensList(returnedTokens);
			messageApi.open({
				key: "success",
				type: "success",
				content: "Campaign Started and Codes Generated!",
				duration: 5,
			});
		}
	};

	return (
		<Modal
			onCancel={() => {
				if (tokensList.length === 0) {
					setShowModal(false);
					setSelectedCampaign(null);
				} else {
					messageApi.open({
						key: "warning",
						type: "warning",
						content: "Please, download the tokens list first!",
						duration: 5,
					});
				}
			}}
			maskClosable={false}
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
					<Text strong>{campaign.donor}</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Beneficiary:</Text>
				</Col>
				<Col span={12}>
					<Text strong>{campaign.receiver}</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Starting Date:</Text>
				</Col>
				<Col span={12}>
					<Text>
						{format(
							new Date(campaign.startingDate),
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
							new Date(campaign.deadline),
							"dd/MM/yyyy HH:mm"
						)}
					</Text>
				</Col>
			</Row>
			<Divider />
			<Title level={4}>Generating Tokens Details</Title>
			<Text style={{ fontSize: 16 }}>
				If you haven't started the campaign yet, press FUND to finance
				the campaign and <Text strong>start the donations</Text>.<br />
				You will receive unique codes to download and distribute within
				your products. It will{" "}
				<Text strong type="danger">
					not be possible to re-download the codes
				</Text>{" "}
				so preserve them carefully
			</Text>
			<br />
			{tokensList.length === 0 && (
				<Flex align="center" justify="center" style={{ marginTop: 20 }}>
					{isExpired(campaign.startingDate) ? (
						<Button
							size="large"
							type="primary"
							shape="round"
							onClick={() => handleStart()}
						>
							FUND the CAMPAIGN
						</Button>
					) : (
						<Text strong>Waiting for the Campaign to start</Text>
					)}
				</Flex>
			)}
			{tokensList.length > 0 && (
				<Space
					direction="vertical"
					style={{ width: "100%", marginTop: 20 }}
				>
					<List
						style={{
							width: "100%",
							overflowX: "auto",
							whiteSpace: "nowrap",
						}}
						size="small"
						bordered
						dataSource={tokensList}
						renderItem={(item) => (
							<div
								style={{
									marginRight: 10,
								}}
							>
								<List.Item>{item.token.toString()}</List.Item>
							</div>
						)}
						pagination={{ pageSize: 5 }}
					/>
					<Flex
						align="center"
						justify="center"
						style={{ marginTop: 20 }}
					>
						<br />
						<Button
							size="large"
							type="primary"
							shape="round"
							onClick={() => {
								exportToExcel();
							}}
						>
							DOWNLOAD TOKENS
						</Button>
					</Flex>
				</Space>
			)}
		</Modal>
	);
};

export default GenerateTokensModal;
