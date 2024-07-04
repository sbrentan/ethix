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
	Space,
	Radio,
	Modal,
} from "antd";
import { useEffect, useState } from "react";
import { ROLES } from "../../config/roles";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
	useGetProfileRequestsQuery,
	useUpdateProfileRequestMutation,
} from "./requestsApiSlice";
import BeneficiaryProfile from "../../components/BeneficiaryProfile";
import DonorProfile from "../../components/DonorProfile";

const { Option } = Select;
const { Text, Title } = Typography;

// for the warning: Each child in a list should have a unique "key" prop.
const generateRowKey = (request) => {
	// Return a unique identifier for each request (e.g., request ID)
	return request.id;
};

const ProfileRequestsList = () => {
	const [filteredProfileRequests, setFilteredProfileRequests] = useState([]);
	// for antd message
	const [messageApi, contextHolder] = message.useMessage();
	// Selection mode
	const [selectedOption, setSelectedOption] = useState("waiting");

	// To see the selected profile request
	const [selectedProfileRequest, setSelectedProfileRequest] = useState(null);
	const [showViewModal, setShowViewModal] = useState(false);

	const {
		data: normalizedProfilerequests,
		isLoading,
		isFetching,
		isSuccess,
		isError,
		error,
	} = useGetProfileRequestsQuery("profilerequestsList", {});

	const [
		updateProfilerequest,
		{
			isLoading: updateIsLoading,
			isSuccess: updateIsSuccess,
			isError: updateIsError,
			error: updateError,
		},
	] = useUpdateProfileRequestMutation("profilerequestsList");

	// When users or the filter change it perform a filters evaluation
	useEffect(() => {
		let filteredResult = [];
		if (isSuccess) {
			const { ids, entities } = normalizedProfilerequests;
			filteredResult = ids.filter((id) => {
				const request = entities[id];

				const statusCondition = request.state === selectedOption;

				return statusCondition;
			});
		}
		setFilteredProfileRequests(filteredResult);
	}, [normalizedProfilerequests, isSuccess, isFetching, selectedOption]);

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
				content: "Request updated successfully",
				duration: 5,
			});
		} // eslint-disable-next-line
	}, [updateIsSuccess, updateIsError, updateError]);

	const onFinish = async (state, id) => {
        await updateProfilerequest({ id, state})
        setSelectedProfileRequest(null)
        setShowViewModal(false)
    };

	// Columns of the Table
	const columns = [
		{
			title: "Username",
			dataIndex: "username",
			key: "username",
		},
		{
			title: "Ruolo",
			dataIndex: "role",
			key: "role",
			render: (action, record) => {
				let color = "volcano";
				if (record.role === ROLES.Beneficiary) {
					color = "green";
				} else if (record.role === ROLES.Donor) {
					color = "purple";
				}

				return (
					<Tag color={color} key={record.role}>
						{record.role.toUpperCase()}
					</Tag>
				);
			},
		},
		{
			title: "Status",
			dataIndex: "state",
			key: "state",
		},
		{
			title: "Action",
			dataIndex: "action",
			render: (action, record) => (
				<Button
					onClick={() => {
						setSelectedProfileRequest(record);
						setShowViewModal(true);
					}}
				>
					View Request
				</Button>
			),
		},
	];

	let errContent = null;
	let tableSource = null;
	let tableContent = (
		<Table columns={columns} pagination={false} dataSource={tableSource} />
	);
	if (isError) {
		errContent = (
			<Text type="danger" strong>
				Error while receiving data: {error?.data?.message}
			</Text>
		);
		//if (!preventPolling) setPreventPolling(true)
	} else if (isSuccess) {
		//if (preventPolling) setPreventPolling(false)
		if (filteredProfileRequests.length) {
			const { entities } = normalizedProfilerequests;
			tableSource = filteredProfileRequests
				.map((id) => entities[id])
				.filter((entity) => entity !== undefined);
		}

		tableContent = (
			<Table
				columns={columns}
				dataSource={tableSource}
				rowKey={generateRowKey}
				pagination={filteredProfileRequests.length < 100 ? false : true}
			/>
		);
	}

	return (
		<div>
			{contextHolder}
			<Title>Requests</Title>
			<div
				style={{
					textAlign: "center",
					margin: "auto",
					width: "50%",
					paddingTop: 10,
				}}
			>
				<Radio.Group
					value={selectedOption}
					buttonStyle="solid"
					onChange={(e) => {
						setSelectedOption(e.target.value);
					}}
				>
					<Radio.Button value="waiting">New Requests</Radio.Button>
					<Radio.Button value="accepted">
						Accepted Requests
					</Radio.Button>
					<Radio.Button value="rejected">
						Rejected Requests
					</Radio.Button>
				</Radio.Group>
				<hr />
			</div>
			{errContent}
			<div>{tableContent}</div>
			{showViewModal && selectedProfileRequest && (
				<Modal
					onCancel={() => {
						setShowViewModal(false);
						setSelectedProfileRequest(false);
					}}
					open={showViewModal}
					width={1000}
					centered
					style={{ marginTop: "50px", marginBottom: "50px" }}
					title={showViewModal ? "Request Data" : "Edit Request"}
					// okText={showViewModal ? "Edit" : "Save"}
					cancelText={showViewModal ? "Close" : "Cancel"}
					// onOk={() => {
					// 	if (showViewModal) {
					// 		setShowViewModal(false);
					// 	}
					// }}
					okButtonProps={{ style: { display: "none" } }}
				>
					{selectedProfileRequest.role === ROLES.Donor ? (
						<DonorProfile
							profile={selectedProfileRequest.donorData}
						/>
					) : (
						<BeneficiaryProfile
							profile={selectedProfileRequest.beneficiaryData}
						/>
					)}
					{/* {selectedProfileRequest.state === "waiting" && */}
					{true &&
                    <div
						style={{
							textAlign: "center",
							margin: "auto",
							width: "50%",
							paddingTop: 10,
						}}
					>
						<Space direction="horizontal">
							<Button danger type="primary" onClick={() => onFinish("rejected", selectedProfileRequest.id)}>
								Reject
							</Button>
							<Button
								type="primary"
								style={{ background: "#74B72E" }}
								onClick={() => onFinish("accepted", selectedProfileRequest.id)}
							>
								Accept
							</Button>
						</Space>
					</div>}
				</Modal>
			)}
		</div>
	);
};

export default ProfileRequestsList;
