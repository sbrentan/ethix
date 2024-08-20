import {
	Button,
	Select,
	Typography,
	message,
	Row,
	Col,
	Table,
	Input,
    Tag,
    Space
} from "antd";
import { useEffect, useState } from "react";
import { ROLES } from "../../config/roles";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { useGetUsersQuery, useUpdateUserMutation } from "./usersApiSlice";
import { hideLoading, showLoading } from "../../app/loadingSlice";
import { useDispatch } from "react-redux";

const { Option } = Select;
const { Text, Title } = Typography;

const options = Object.values(ROLES).map((role) => {
	return (
		<Option key={role} value={role}>
			{role}
		</Option>
	);
});

// for the warning: Each child in a list should have a unique "key" prop.
const generateRowKey = (user) => {
	// Return a unique identifier for each user (e.g., user ID)
	return user.id;
};

const UsersList = () => {
	// state and filters
	const [usernameFilter, setUsernameFilter] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [filteredUsers, setFilteredUsers] = useState([]);

	// for antd message
	const [messageApi, contextHolder] = message.useMessage();
    const dispatch = useDispatch()

	const {
		data: normalizedUsers,
		isLoading,
		isFetching,
		isSuccess,
		isError,
		error,
	} = useGetUsersQuery("usersList", {});

	const [
		updateUser,
		{
			isLoading: updateIsLoading,
			isSuccess: updateIsSuccess,
			isError: updateIsError,
			error: updateError,
		},
	] = useUpdateUserMutation("usersList");

	// When users or the filter change it perform a filters evaluation
	// Filtered result is the ID lists of the filtered bookings
	useEffect(() => {
		let filteredResult = [];
		if (isSuccess) {
			const { ids, entities } = normalizedUsers;
			filteredResult = ids.filter((userId) => {
				const user = entities[userId];

				const usernameCondition =
					usernameFilter === "" ||
					user.username
						.toLowerCase()
						.includes(usernameFilter.toLowerCase());

				const roleCondition =
					roleFilter === "" ||
					user.role.toLowerCase() === roleFilter.toLowerCase();

				return usernameCondition && roleCondition;
			});
		}
		setFilteredUsers(filteredResult);
	}, [normalizedUsers, isSuccess, isFetching, usernameFilter, roleFilter]);

	// Gestione Azioni su utenti
	const navigate = useNavigate();

    // Loading Overlay
	useEffect(() => {
		if (isLoading || updateIsLoading) dispatch(showLoading());
		else dispatch(hideLoading()); // eslint-disable-next-line
	}, [isLoading, updateIsLoading]);

	// Error Overlay
	useEffect(() => {
		if (isError) {
			messageApi.open({
				key: "error",
				type: "error",
				content: error?.data?.message,
				duration: 5,
			});
		}
	}, [isError, error]);

	useEffect(() => {
		if (updateIsError) {
			messageApi.open({
				key: "updateError",
				type: "error",
				content: updateError?.data?.message,
				duration: 5,
			});
		} else if (updateIsSuccess) {
			messageApi.open({
				type: "success",
				content: "User updated successfully",
				duration: 5,
			});
		} // eslint-disable-next-line
	}, [updateIsSuccess, updateIsError, updateError]);

	// Columns of the Table
	const columns = [
		{
			title: "Username - Email",
			dataIndex: "username",
			key: "username",
		},
		{
			title: "Role",
			dataIndex: "role",
			key: "role",
			render: (action, record) => {
                let color = 'geekblue'
                if (record.role === ROLES.Beneficiary) {
                    color = 'green'
                } else if (record.role === ROLES.Donor) {
                    color = 'purple'
                } else if (record.role === ROLES.Admin) {
                    color = 'volcano'
                }
                
                return   (
				<Tag color={color} key={record.role}>
					{record.role.toUpperCase()}
				</Tag>)
            },
		},
        {
            title: "Verified",
            dataIndex: "verified",
            key: "verified",
            render: (verified) => (verified ? "Verified" : "Not Verified"),
        },
		{
			title: "Action",
			dataIndex: "action",
			render: (action, record) => (
				<Button onClick={() => navigate(`/admin/users/${record.id}`)}>
					Edit User
				</Button>
			),
		},
	];

	let errContent = null;
	let tableSource = null;
	let tableContent = <Table columns={columns} pagination={false} dataSource={tableSource} />;
	if (isError) {
		errContent = (
			<Text type="danger" strong>
				Error while receiving data: {error?.data?.message}
			</Text>
		);
		//if (!preventPolling) setPreventPolling(true)
	} else if (isSuccess) {
		//if (preventPolling) setPreventPolling(false)
		if (filteredUsers.length) {
			const { entities } = normalizedUsers;
			tableSource = filteredUsers
				.map((userId) => entities[userId])
				.filter((entity) => entity !== undefined);
		}

		tableContent = (
			<Table
				columns={columns}
				dataSource={tableSource}
				rowKey={generateRowKey}
                pagination={(filteredUsers.length < 100 ? false : true)}
			/>
		);
	}

	return (
		<div>
			{contextHolder}
			<Space direction="horizontal">
				<Title>Users</Title>
				<Button
					size="large"
					type="primary"
					onClick={() => navigate(`/admin/users/new`)}
				>
					Create User
				</Button>
			</Space>
			<div>
				{/*	FILTERS SECTION */}
				<Row>
					<Col span={12}>
						<Input
							name="usernameFilter"
							type="text"
							placeholder="Username - Email"
							value={usernameFilter}
							onChange={(e) => setUsernameFilter(e.target.value)}
						/>
					</Col>
					<Col span={6}>
						<Select
							mode="single"
							style={{ display: "flex" }}
							name="roleFilter"
							value={roleFilter}
							onChange={(option) => setRoleFilter(option)}
						>
							<Option value="" key="disabled" disabled>
								Select role
							</Option>
							{options}
						</Select>
					</Col>
					<Col span={6}>
						<Button
							onClick={() => {
								setUsernameFilter("");
								setRoleFilter("");
							}}
						>
							Remove filters
						</Button>
					</Col>
				</Row>
			</div>
			{errContent}
			<div>{tableContent}</div>
		</div>
	);
};

export default UsersList;
