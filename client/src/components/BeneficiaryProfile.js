import { Col, Form, Input, Row, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

const BeneficiaryProfile = ({ profile, disabled = true }) => {
	const [form] = Form.useForm();
	if (!profile) return <p>Something went wrong</p>;
	return (
		<div>
			<Form initialValues={profile} form={form} disabled={disabled} layout="vertical">
				<Title level={5}>Beneficiary general information</Title>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Beneficiary Name"
							name="beneficiaryName"
							rules={[
								{
									required: true,
									message: "Insert the beneficiary name",
								},
							]}
						>
							<Input />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Owner"
							name="ownerName"
							required
							rules={[
								{
									required: true,
									message: "Insert the owner",
								},
							]}
						>
							<Input />
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={24}>
						<Form.Item
							label="Contact Number"
							name="contactNumber"
							required
							rules={[
								{
									required: true,
									message: "Insert the contact number",
								},
							]}
						>
							<Input />
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={24}>
						<Form.Item
							label="Type of Organization"
							name="organizationType"
							required
							rules={[
								{
									required: true,
									message: "Insert the type of Organization",
								},
							]}
						>
							<Input />
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default BeneficiaryProfile;
