import { useRef, useState, useEffect } from "react";
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

const { Text, Title } = Typography;

const Login = () => {
	const [form] = Form.useForm();
	const [persist, setPersist] = usePersist();
	const [login, { isLoading }] = useLoginMutation();
	const [needVerify, setNeedVerify] = useState(false);

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
			const { accessToken } = await login({
				username,
				password,
			}).unwrap();
			dispatch(setCredentials({ accessToken }));
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
						title="Account non verificato"
						subTitle="Per accedere ai tuoi contenuti e' necessario verificare l'account."
						extra={
							<Button
								type="primary"
								key="login"
								onClick={() => {
									navigate("/verify");
								}}
							>
								Verifica l'account
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
								<Form
									form={form}
									layout="vertical"
									onFinish={handleSubmit}
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
														"Inserire la Email",
												},
												{
													type: "email",
													message:
														"Prego inserisci un indirizzo mail valido",
												},
											]}
										>
											<Input
												ref={userRef}
												placeholder="Inserisci il tuo indirizzo email"
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
														"Inserisci la tua password",
												},
											]}
										>
											<Input.Password placeholder="Inserisci la tua password" />
										</Form.Item>
									</div>
									<div style={{ width: "300px", margin: "0 auto" }}>
										<Button
											type="primary"
											htmlType="submit"
											block
										>
											Accedi
										</Button>
									</div>
									<div>
										<Link
											to="/forgot-password"
											style={{ float: "right" }}
										>
											Password dimenticata?
										</Link>
										<div></div>
										<Form.Item
											name="persist"
											valuePropName="checked"
											noStyle
										>
											<Checkbox onChange={handleToggle}>
												{" "}
												Salva questo dispositivo{" "}
											</Checkbox>
										</Form.Item>
									</div>
									<hr />
									<div>
										Non sei registrato?
										<Link to="/register">
											{" "}
											Registrati ora
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
