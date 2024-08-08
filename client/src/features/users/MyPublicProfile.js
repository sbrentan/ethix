import {
	Col,
	Form,
	Row,
	Typography,
	Input,
	Image,
	Flex,
	Space,
	Button,
	message,
} from "antd";
import React, { useEffect } from "react";
import {
	useGetMyPublicProfileQuery,
	useUpdateMyPublicProfileMutation,
} from "../requests/requestsApiSlice";

const { Text, Title } = Typography;

const MyPublicProfile = () => {
	const [form] = Form.useForm();

	// for antd message
	const [messageApi, contextHolder] = message.useMessage();

	// GET MY PROFILE
	const {
		data: profile,
		isLoading: isProfileLoading,
		isSuccess: isProfileSuccess,
		isError: isProfileError,
		error: profileError,
		refetch: refetchProfile,
	} = useGetMyPublicProfileQuery();

	const [update, { isLoading, isSuccess, isError, error }] =
		useUpdateMyPublicProfileMutation();

	// Errore
	useEffect(() => {
		if (isError) {
			messageApi.open({
				key: "error",
				type: "error",
				content: error?.data?.message,
				duration: 5,
			});
		} else if (isSuccess) {
			messageApi.open({
				key: "success",
				type: "success",
				content: "Information modified correctly!",
				duration: 5,
			});
		}
	}, [isError, isSuccess, error]);

	if (!profile) return <p>Waiting for data...</p>;

	const {
		publicName,
		publicDescription,
		publicImage,
		_id: profileId,
	} = profile;
	const initialValues = { publicName, publicDescription, publicImage };

	const handleSubmit = async (values) => {
		await update({ ...values, profileId });
	};

	return (
		<div style={{ marginLeft: "0.8rem", marginTop: "0.8rem" }}>
			{contextHolder}
			<Form
				initialValues={initialValues}
				form={form}
				onFinish={handleSubmit}
				layout="vertical"
			>
				<Title level={5}>Public Presentation Information</Title>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Company or Organization Name"
							name="publicName"
							rules={[
								{
									required: true,
									message: "Insert the company name",
								},
							]}
						>
							<Input />
						</Form.Item>
						<Form.Item
							label="Describe your Company or Organization"
							name="publicDescription"
						>
							<Input.TextArea />
						</Form.Item>
						<Form.Item
							label="Image"
							name="publicImage"
							rules={[
								{
									required: false,
									message: "Insert valid title",
								},
							]}
						>
							<Input placeholder={"Insert image URL"} />
						</Form.Item>
						<br />
						<Flex align="center" justify="center">
							<Space direction="horizontal" size={20}>
								<Button>Cancel</Button>
								<Button type="primary" htmlType="submit">
									Save
								</Button>
							</Space>
						</Flex>
					</Col>
					<Col span={12}>
						<Flex align="center" justify="center">
							<Image
								src={publicImage ? publicImage : "error"}
								width={400}
								preview={publicImage ? true : false}
							/>
						</Flex>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default MyPublicProfile;
