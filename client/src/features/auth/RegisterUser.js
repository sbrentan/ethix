import { Button, Form, Input, message } from "antd";
import React, { useEffect, useRef, useContext } from "react";
import { useRegisterMutation } from "./authApiSlice";
import { TransactionContext } from ".//../../context/TransactionContext.js";

const RegisterUser = ({ setSuccessRegistration }) => {
	const [form] = Form.useForm();
    const [register, { isLoading, isSuccess, isError, error }] =
		useRegisterMutation();
	const userRef = useRef();

    // for antd message
	const [messageApi, contextHolder] = message.useMessage();

	const {
			wallet,
		} = useContext(TransactionContext);

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
		const { username, password } = values;
        const data = { username, wallet, password }
        // console.log(data)
		await register(data);
	};

	return (
		<>
            {contextHolder}
			<Form form={form} layout="vertical" onFinish={handleSubmit}>
				<div style={{ width: "300px", margin: "0 auto" }}>
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
				</div>
                <br/>
				<div style={{ width: "300px", margin: "0 auto" }}>
					<Button type="primary" htmlType="submit" block>
						Confirm
					</Button>
				</div>
                <br/>
			</Form>
		</>
	);
};

export default RegisterUser;
