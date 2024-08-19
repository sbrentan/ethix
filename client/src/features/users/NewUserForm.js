import { useEffect } from "react"
import { useAddNewUserMutation } from "./usersApiSlice"
import { useNavigate } from "react-router-dom"
import { ROLES } from "../../config/roles"
import { Form, Input, Select, Row, Col, Button, message, Typography } from "antd"

const { Option } = Select
const { Title } = Typography

const options = Object.values(ROLES).map(role => {
    return (
        <Option
            key={role} value={role}>
            {role}
        </Option>
    )
})

// Form to create a new user by an admin
const NewUserForm = () => {
    const [form] = Form.useForm();

	// for antd message
	const [messageApi, contextHolder] = message.useMessage();

    const initialValues = {
        username: "",
        password: "",
        role: ROLES.User
    }

    // gives us a addNewUser function that when can use, and the object
    // that delivers the status after we call the function
    // the query was called immediately, till is not called until we want
    const [addNewUser, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useAddNewUserMutation()

    const navigate = useNavigate()

    // Successo creazione nuovo account
    useEffect(() => {
        if (isSuccess) {
            message.success("Account created", 5)
            navigate(`/admin/users`)
        }
    }, [isSuccess, navigate])

    // Errore
    useEffect(() => {
        if (isError) {
            messageApi.open({
				key: 'error',
				type: 'error',
				content: error?.data?.message,
				duration: 5,
			});
        }
    }, [isError, error])

    // quando premo cancella - Drop changes
    const handleCancel = () => {
        form.resetFields(); // Reset the form fields to initial values
        navigate(-1)
    };

    // quando premo invio - Save User
	const onFinish = async (values) => {
        const { username, password, role } = values
        // TODO: input sanitation
        await addNewUser({ username, password, role, })
	};
    
    return (
        <>
            {contextHolder}
            <Title>Create new account</Title>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={initialValues}
            >
                <Row gutter={[10, 10]} justify="space-between">
                    <Col lg={24} xs={24}>
                        <Form.Item
                            label="Username:"
                            name="username"
                            rules={[
                                { required: true, message: 'Insert Email' },
                                { type: 'email', message: 'please insert valid email', },
                            ]}
                        >
                            <Input
                                autoComplete="off"
                            />
                        </Form.Item>
                    </Col>
                    <Col lg={24} xs={24}>
                        <Form.Item
                            label="Password"
                            name="password"
                                rules={[
                                    {
                                        pattern: new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,30}$/),
                                        message: "the password must be between 8 and 30 characters long, contain a combination of uppercase and lowercase letters and a number"
                                    },
                                ]}
                        >
                            <Input.Password />
                        </Form.Item>
                    </Col>
                    <hr />
                    <Col lg={24} xs={24}>
                        <Form.Item label="Role:" name="role" rules={[{ required: true, message: 'Insert new role' }]}>
                            <Select
                                mode="single"
                                size="large"
                                >{options}</Select>
                        </Form.Item>
                    </Col>
                    <Col>
                        <Button htmlType="button" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </Col>
                    <Col>
                        <Button type="primary" htmlType="submit">
                            Save
                        </Button>
                    </Col>
                </Row>
            </Form>
        </>
    );
}

export default NewUserForm