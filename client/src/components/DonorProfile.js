import { Col, Form, Input, Row, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

const DonorProfile = ({ profile, disabled = true }) => {
	const [form] = Form.useForm();
	if (!profile) return <p>Something went wrong</p>;
	return (
		<div>
			<Form initialValues={profile} form={form} disabled={disabled} layout="vertical">
				<Title level={5}>Company general information</Title>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Company Name"
							name="companyName"
							rules={[
								{
									required: true,
									message: "Insert the company name",
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
							label="Type of Business"
							name="businessType"
							required
							rules={[
								{
									required: true,
									message: "Insert the type of Business",
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

export default DonorProfile;
