import { useRef, useState, useEffect, useContext } from "react";
import {
	Form,
	Input,
	Button,
	Checkbox,
	Typography,
	Result,
	Row,
	Col,
	Card,
	message,
} from "antd";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { useLoginMutation } from "./authApiSlice";
import usePersist from "../../hooks/usePersist";
import useTitle from "../../hooks/useTitle";
import Cookies from 'universal-cookie';
import { TransactionContext } from ".//../../context/TransactionContext.js";
import MetamaskButton from ".//../../components/MetamaskButton.js";
const cookies = new Cookies();

const { Text, Title } = Typography;

const Login = () => {
	const [form] = Form.useForm();
	const [persist, setPersist] = usePersist();
	const [login, { isLoading }] = useLoginMutation();
	const [needVerify, setNeedVerify] = useState(false);
	let formDisabled = true;
	const {
			wallet,
		} = useContext(TransactionContext);

	const userRef = useRef();

	// for antd message
	const [messageApi, contextHolder] = message.useMessage();

	const navigate = useNavigate();
	const dispatch = useDispatch();

	useEffect(() => {
		if (!needVerify) userRef.current.focus(); // focus to username field
	}, []);

	const handleSubmit = async (values) => {
		try {
			const { username, password } = values;
			const address = wallet.address;
			const { accessToken } = await login({
				username,
				password,
				address,
				
			}).unwrap();
			dispatch(setCredentials({ accessToken }));
			cookies.set('jwt_cookie', accessToken);
			navigate("/home");
		} catch (err) {
			if (!err.status) {
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
					content: err?.data?.message,
					duration: 5,
				});
			}
		}
	};

	const handleToggle = () => setPersist((prev) => !prev);

	return (
		<div>
			{contextHolder}
            
			{needVerify ? (
				<>
					<Result
						status="warning"
						title="account not verified"
						subTitle="to access the application you need to verify your account"
						extra={
							<Button
								type="primary"
								key="login"
								onClick={() => {
									navigate("/verify");
								}}
							>
								Verify account
							</Button>
						}
					/>
				</>
			) : (
				<div>
					<Row style={{ marginTop: 20 }}>
						<Col span={4} />
						<Col span={16}>
							<Card
								style={{
									width: "100%",
								}}
								size={"large"}
							>
								<Title>Login</Title>
								{!wallet.is_logged && (
									<MetamaskButton></MetamaskButton>
								)}
								{wallet.is_logged && (
									<p>Connected wallet: {wallet.address}</p>
									) && (formDisabled = false)}
								<Form
									form={form}
									layout="vertical"
									onFinish={handleSubmit}
									disabled={formDisabled}
									initialValues={{ persist }}
								>
									<div
										style={{
											width: "300px",
											margin: "0 auto",
										}}
									>
										<Form.Item
											label="Email"
											name="username"
											rules={[
												{
													required: true,
													message:
														"insert your email",
												},
												{
													type: "email",
													message:
														"please enter a valid email",
												},
											]}
										>
											<Input
												ref={userRef}
												placeholder="insert your email"
												autoComplete="off"
											/>
										</Form.Item>
										<Form.Item
											label="Password"
											name="password"
											rules={[
												{
													required: true,
													message:
														"insert your password",
												},
											]}
										>
											<Input.Password placeholder="insert your password" />
										</Form.Item>
									</div>
									<div style={{ width: "300px", margin: "0 auto" }}>
										<Button
											type="primary"
											htmlType="submit"
											block
										>
											Login
										</Button>
									</div>
									<div>
										<Link
											to="/forgot-password"
											style={{ float: "right" }}
										>
											Forgot your password?
										</Link>
										<div></div>
										<Form.Item
											name="persist"
											valuePropName="checked"
											noStyle
										>
											<Checkbox onChange={handleToggle}>
												{" "}
												Remember this device{" "}
											</Checkbox>
										</Form.Item>
									</div>
									<hr />
									<div>
										Not Registered?
										<Link to="/register">
											{" "}
											Register Now
										</Link>
									</div>
								</Form>
							</Card>
						</Col>
						<Col span={4} />
					</Row>
				</div>
			)}
		</div>
	);
};

export default Login;
