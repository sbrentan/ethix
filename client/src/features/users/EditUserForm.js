import { useEffect, useState } from "react"
import { useUpdateUserMutation, useDeleteUserMutation } from "./usersApiSlice"
import { useNavigate } from "react-router-dom"
import { ROLES } from "../../config/roles"
import { Form, Input, Select, Row, Col, Button, Popconfirm, message, Space, Switch, Typography } from "antd"
import { useDispatch } from "react-redux"

const { Option } = Select
const { Text, Title } = Typography


const options = Object.values(ROLES).map(role => {
    return (
        <Option
            key={role} value={role}>
            {role}
        </Option>
    )
})

// Component to edit or delete user by admin.
// The user to edit is passed through props, and used to load the form with the corresponding values.
// The result of operations are shown as message.
const EditUserForm = ({ user }) => {
    const [form] = Form.useForm();

    // for antd message
	const [messageApi, contextHolder] = message.useMessage();

    const [updateUser, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useUpdateUserMutation()

    const [deleteUser, {
        isLoading: isDelLoading,
        isSuccess: isDelSuccess,
        isError: isDelError,
        error: delError
    }] = useDeleteUserMutation()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Successo delle operazioni
    useEffect(() => {
        if (isSuccess) {
            messageApi.open({
				key: 'success',
				type: 'success',
				content: "Account modificato correttamente!",
				duration: 5,
			});
        }
    }, [isSuccess])

    useEffect(() => {
        if (isDelSuccess) {
            message.success("Account eliminato correttamente", 5);
            navigate(`/admin/users`)
        }
    }, [isDelSuccess, navigate])

    // Errore
    useEffect(() => {
        if (isError) {
            messageApi.open({
				key: 'error',
				type: 'error',
				content: error?.data?.message,
				duration: 5,
			});
        } else if (isDelError) {
            messageApi.open({
				key: 'delError',
				type: 'error',
				content: delError?.data?.message,
				duration: 5,
			});
        }
    }, [isError, isDelError, error, delError])


    // quando premo cancella - Drop changes
    const handleCancel = () => {
        form.resetFields(); // Reset the form fields to initial values
        navigate(-1)
    };


    // quando premo invio - Save User
	const onFinish = async (values) => {
        const { username, password, role } = values

        if (password) {
            await updateUser({ id: user.id, username, password, role })
        } else {
            await updateUser({ id: user.id, username, role })
        }
	};

    // quando cancello utente - Delete User
    const onDeleteUserClicked = async () => {
        await deleteUser({ id: user.id })
    }

    return (
        <>
            {contextHolder}
            <div>
                <Title>Modifica l'utente: {user.username}</Title>
                {user ? (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={user}
                >
                    <Row gutter={[10, 10]} justify="space-between">
                        <Col lg={24} xs={24}>
                            <Form.Item
                                label="Username:"
                                name="username"
                                rules={[
                                    { required: true, message: 'Inserire la Email' },
                                    { type: 'email', message: 'Prego inserisci un indirizzo mail valido', },
                                ]}
                            >
                                <Input
                                    autocomplete="off"
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
                                        message: "La password deve essere lunga tra 8 e 30 caratteri, contenere combinazione di lettere maiuscole, minuscole e un numero"
                                    },
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                        <Col lg={24} xs={24}>
                            <Form.Item label="Ruolo:" name="role">
                                <Select
                                    mode="single"
                                    size="large"
                                    >{options}</Select>
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button htmlType="button" onClick={handleCancel}>
                                Cancella
                            </Button>
                        </Col>
                        <Col>
                            <Button type="primary" htmlType="submit">
                                Conferma
                            </Button>
                        </Col>
                    </Row>
                </Form>
                ) : (
                    <p>Nessun dato disponibile!</p>
                )}
                <hr />
                <Title>Cancella l'utente: {user.username}</Title>
                <br />
                <Text type='danger'>Attenzione, questa operazione non puo' essere annullata</Text>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Popconfirm
                        title="Cancella l'utente"
                        description="Sei sicuro di voler cancellare l'utente?"
                        onConfirm={onDeleteUserClicked}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger>Delete</Button>
                    </Popconfirm>
                </div>

            </div>
        </>
    )
}

export default EditUserForm