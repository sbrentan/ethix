import { Col, Divider, Modal, Row, Typography } from "antd";
import React from "react";
const { Text, Title } = Typography;

const GenerateTokensModal = ({
	campaign,
	setSelectedCampaign,
	showModal,
	setShowModal,
}) => {
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
			<Divider />
			<Title level={4}>Generating Tokens Details</Title>
		</Modal>
	);
};

export default GenerateTokensModal;
