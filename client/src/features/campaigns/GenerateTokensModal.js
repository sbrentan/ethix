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
import React, { useContext, useEffect, useRef, useState } from "react";
import { TransactionContext } from "../../context/TransactionContext";
import ExcelJS from "exceljs";
import { useEthPrice } from "use-eth-price";
import QRCode from "qrcode";
import jsPDF from "jspdf";

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
    refetch
}) => {
	const [tokensList, setTokensList] = useState([]);
    const [canClose, setCanClose] = useState(true)

	const { startCampaign } = useContext(TransactionContext);
    const { ethPrice, loading, errorEth } = useEthPrice("eur");
	
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
                nr: index,
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

			setCanClose(true)
		});
	};

	const exportToPdf = async () => {
		if (!Array.isArray(tokensList) || !tokensList.length) {
			return messageApi.open({
				key: "error",
				type: "error",
				content: "Nessun dato disponibile da scaricare",
				duration: 5,
			});
		}

		try {

			const pdf = new jsPDF();
			const qrCodeData = [];

			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();

			const qrSize = 100; // Size of each QR code
			const x = (pageWidth - qrSize) / 2;
			const y = (pageHeight - qrSize) / 2;
			
			for (const token of tokensList) {
				// Generate QR code as data URL using the qrcode library
				const url = process.env.REACT_APP_BASE_URL + "/redeem/" + token.token;
				const imageData = await QRCode.toDataURL(url);
				qrCodeData.push(imageData);
			}

			qrCodeData.forEach((image, index) => {
				pdf.addImage(image, "JPEG", x, y, qrSize, qrSize);

				if (index != qrCodeData.length - 1)
					pdf.addPage();
			});
	
			pdf.save('qr_codes.pdf');
            setCanClose(true)
		} catch (error) {
			console.error("Error generating QR codes or PDF:", error);
		}

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
            setCanClose(false)
			messageApi.open({
				key: "success",
				type: "success",
				content: "Campaign Started and Codes Generated!",
				duration: 5,
			});
		}
	};

    let targetEuro = null;
	let valueOfToken = null;
	if (ethPrice) {
		targetEuro = (campaign.targetEur);
        valueOfToken = ((campaign.target / campaign.tokensCount)* ethPrice).toFixed(2);
	}

	return (
		<Modal
			onCancel={() => {
				if (canClose) {
					setShowModal(false);
					setSelectedCampaign(null);
                    setTokensList([])
                    refetch()
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
					<Text strong>{campaign.donorPublicName ? campaign.donorPublicName : campaign.donor}</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Beneficiary:</Text>
				</Col>
				<Col span={12}>
					<Text strong>{campaign.receiverPublicName ? campaign.receiverPublicName : campaign.receiver}</Text>
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
            <br/>
			<Row>
				<Col span={12}>
					<Text strong>Number of Redeemable Codes:</Text>
				</Col>
				<Col span={12}>
					<Text>
						{campaign.tokensCount}
					</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Value of a Code:</Text>
				</Col>
				<Col span={12}>
					<Text>
						{valueOfToken}
					</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Total Value Campaing (EUR):</Text>
				</Col>
				<Col span={12}>
					<Text>
						{targetEuro}
					</Text>
				</Col>
			</Row>
			<Row>
				<Col span={12}>
					<Text strong>Total Value Campaing (ETH):</Text>
				</Col>
				<Col span={12}>
					<Text>
						{campaign.target}
					</Text>
				</Col>
			</Row>
			
			<Divider />
			<Title level={4}>Generating Codes Details</Title>
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
                        gap="middle"
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
							Download Tokens (.xlsx)
						</Button>
						<br></br>
						<Button
							size="large"
							type="primary"
							shape="round"
							onClick={() => {
								exportToPdf();
							}}
						>
							Download QR Codes (.pdf)
						</Button>
					</Flex>
				</Space>
			)}
		</Modal>
	);
};

export default GenerateTokensModal;
