import { useRef, useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, Typography, Result } from 'antd';
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { useLoginMutation } from "./authApiSlice";
import usePersist from "../../hooks/usePersist";
import useTitle from "../../hooks/useTitle";

const { Text } = Typography;

const Login = () => {
	const [form] = Form.useForm();
	const [persist, setPersist] = usePersist();
	const [login, { isLoading }] = useLoginMutation();
	const [needVerify, setNeedVerify] = useState(false);

	const userRef = useRef();

	const [errMsg, setErrMsg] = useState("");

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
				setErrMsg("Nessuna risposta dal server");
			} else if (err.status === 400) {
				setErrMsg("Non autorizzato");
			} else if (err.status === 401) {
				setErrMsg("Non autorizzato");
			} else if (err.status === 422) {
				setErrMsg("Verifica la tua email");
				// setNeedVerify(true)
			} else {
				setErrMsg(err.data?.message);
			}
		}
	};

	const handleToggle = () => setPersist((prev) => !prev);

	return (
		<div>
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
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
					initialValues={{ persist }}
				>
					<div>
						<Text type="danger" strong>
							{errMsg}
						</Text>
						<br />
					</div>
					<div style={{ width: "300px", margin: "0 auto" }}>
						<Form.Item
							label="Email"
							name="username"
							rules={[
								{
									required: true,
									message: "Inserire la Email",
								},
								{
									type: "email",
									message: "Prego inserisci un indirizzo mail valido",
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
									message: "Inserisci la tua password",
								},
							]}
						>
							<Input.Password
								placeholder="Inserisci la tua password"
							/>
						</Form.Item>
					</div>
					<div style={{ marginBottom: "10px" }}>
						<Button type="primary" htmlType="submit" block>
							Accedi
						</Button>
					</div>
					<div>
						<Link to="/forgot-password" style={{ float: "right" }}>
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
						<Link to="/register"> Registrati ora</Link>
					</div>
				</Form>
			)}
		</div>
	);
};

export default Login;
