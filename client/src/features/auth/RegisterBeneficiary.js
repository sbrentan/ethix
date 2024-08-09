import { Button, Col, Divider, Form, Input, Row, Typography, message } from "antd";
import React, { useEffect, useRef, useContext } from "react";
import { ROLES } from "../../config/roles";
import { useRegisterDonorBeneficiaryMutation } from "./authApiSlice";
import { TransactionContext } from ".//../../context/TransactionContext.js";
import MetamaskButton from ".//../../components/MetamaskButton.js";

const { Text, Title } = Typography

const RegisterBeneficiary = ({ setSuccessRegistration }) => {
	const [form] = Form.useForm();
    let formDisabled = true;
    const [register, { isLoading, isSuccess, isError, error }] =
        useRegisterDonorBeneficiaryMutation();
	const userRef = useRef();

    const {
        wallet,
      } = useContext(TransactionContext);
    // for antd message
	const [messageApi, contextHolder] = message.useMessage();

	useEffect(() => {
		if (isError) {
			if (!error.status) {
                messageApi.open({
                    key: 'error',
                    type: 'error',
                    content: "No response from the server",
                    duration: 5,
                });
			} else {
                messageApi.open({
                    key: 'error',
                    type: 'error',
                    content: error?.data?.message,
                    duration: 5,
                });
			}
		} else if (isSuccess) {
            setSuccessRegistration(true)
        }
	}, [isSuccess, isError, error]);

	const handleSubmit = async (values) => {
		// const { username, password } = values;
		// const data = { username, password, role: ROLES.Beneficiary };
		// // specific check might be requested
		await register({...values, wallet , role: ROLES.Beneficiary });
	};

	return (
		<>
            {contextHolder}
            {!wallet.is_logged && (
            <MetamaskButton></MetamaskButton>
          )}
          {wallet.is_logged && (
            <p>Connected wallet: {wallet.address}</p>
            ) && (formDisabled = false)}
			<br style={{height:"120px"}}></br><Text>Register your non-profit organization by using this form. Required fields are marked with an asterisk (*).</Text>
			<Form form={form} layout="vertical" onFinish={handleSubmit} disabled={formDisabled}>
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
                <Title level={5}>Beneficiary billing address</Title>
                <Row>
                    <Col span={24}>
                    <Form.Item
                            label="Street Address"
                            name="streetAddress"
                            required
                            rules={[
                                {
                                    required: true,
                                    message: "Insert the street address",
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="City"
                            name="cityAddress"
                            rules={[
                                {
                                    required: true,
                                    message: "Insert the city",
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="State"
                            name="stateAddress"
                            required
                            rules={[
                                {
                                    required: true,
                                    message: "Insert the state",
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Zip Code"
                            name="zipCodeAddress"
                            rules={[
                                {
                                    required: true,
                                    message: "Insert the zip Code",
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Country"
                            name="countryAddress"
                            required
                            rules={[
                                {
                                    required: true,
                                    message: "Insert the country",
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
                            label="Message"
                            name="message"
                        >
                            <Input.TextArea />
                        </Form.Item>
                    </Col>
                </Row>

                <Title level={5}>Beneficiary bank information</Title>
                <Row gutter={16}>
					<Col span={16}>
						<Form.Item
							label="IBAN"
							name="iban"
							rules={[
								{
									required: true,
									message: "Insert the IBAN Code",
								},
							]}
						>
							<Input />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							label="SWIFT/BIC"
							name="swiftBic"
							required
							rules={[
								{
									required: true,
									message: "Insert the SWIFT/BIC",
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
							label="Bank Name"
							name="bankName"
							rules={[
								{
									required: true,
									message: "Insert the bank name",
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
							label="Bank Address"
							name="bankAddress"
							required
							rules={[
								{
									required: true,
									message: "Insert the bank address",
								},
							]}
						>
							<Input />
						</Form.Item>
					</Col>
				</Row>

                <Title level={5}>Credential for our Service</Title>
                <Row gutter={16}>
                    <Col span={12}>
                    <Form.Item
						label="Username"
						name="username"
						rules={[
							{
								type: "email",
								message: "Email not valid",
							},
							{
								required: true,
								message: "Insert a valid email address",
							},
						]}
					>
						<Input
							ref={userRef}
							placeholder={"Insert your email address"}
							autoComplete="off"
						/>
					</Form.Item>
                    </Col>
                    <Col span={12}>
                    <Form.Item
						label="Password"
						name="password"
						rules={[
							{
								required: true,
								message: "Insert your password",
							},
							{
								pattern: new RegExp(
									/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,30}$/
								),
								message:
									"The password must be between 8 and 30 characters long, contain a combination of uppercase and lowercase letters and a number",
							},
						]}
					>
						<Input.Password placeholder={"Insert your password"} />
					</Form.Item>
                    </Col>
                </Row>
                <br/>
				<div style={{ width: "300px", margin: "0 auto" }}>
					<Button type="primary" htmlType="submit" block size="large">
						Confirm
					</Button>
				</div>
                <br/>
			</Form>
		</>
	);
};

export default RegisterBeneficiary;
