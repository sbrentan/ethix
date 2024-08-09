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
    Form,
} from "antd";
import { useEffect, useState, useContext } from "react";
import { ROLES } from "../../config/roles";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
	useGetProfileRequestsQuery,
	useUpdateProfileRequestMutation,
} from "./requestsApiSlice";
import BeneficiaryProfile from "../../components/BeneficiaryProfile";
import DonorProfile from "../../components/DonorProfile";
import Web3 from 'web3';
import { CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS } from './../../utils/constants';
import { TransactionContext } from ".//../../context/TransactionContext.js";

const { Option } = Select;
const { Text, Title } = Typography;

const { ethereum } = window;

// for the warning: Each child in a list should have a unique "key" prop.
const generateRowKey = (request) => {
	// Return a unique identifier for each request (e.g., request ID)
	return request.id;
};

const ProfileRequestsList = () => {

	const {
		wallet,
		createCampaign,
	} = useContext(TransactionContext);

	const web3 = new Web3(ethereum);
	const charityContract = new web3.eth.Contract(CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS);
	
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

	const onFinish = async (state, address, id) => {
		if (!ethereum) return alert("Please install MetaMask.");
        try {
            if (!address) throw new Error("Address is missing")
            if (state === "accepted") {
		        await charityContract.methods.verifyOrganization(address).send({ from: wallet.address });
            } else if (state === "rejected") {
                await charityContract.methods.revokeOrganization(address).send({ from: wallet.address });
            }
		    await updateProfilerequest({ id, state}) //update the request		//check on blockchain if the organization is verified
            
            setSelectedProfileRequest(null)
            setShowViewModal(false)
        } catch (err) {
            messageApi.open({
				key: "error",
				type: "error",
				content: err.message,
				duration: 5,
			});
        }
    };

    const checkIfVerified = async (address) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            if (!address) throw new Error("Address is missing")

            await charityContract.methods.isOrganizationVerified(address).call({ from: wallet.address })
                .then((response) => {
                    response ? messageApi.open({
                        key: "warning",
                        type: "warning",
                        content: "Organization is Verified",
                        duration: 5,
                    }) : messageApi.open({
                        key: "warning",
                        type: "warning",
                        content: "Organization is NOT Verified",
                        duration: 5,
                    });
                });
        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            messageApi.open({
				key: "error",
				type: "error",
				content: errorMessage,
				duration: 5,
			});
        }
    }

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
                <Space direction="horizontal" size={10}>
				<Button
					onClick={() => {
						checkIfVerified(record?.address)
					}}
				>
					Check Verification
				</Button>
				<Button
                style={{ background: "#e5e5e5" }}
					onClick={() => {
						setSelectedProfileRequest(record);
						setShowViewModal(true);
					}}
				>
					View Request
				</Button>
                </Space>
			),
            width: 100,
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
				pagination={filteredProfileRequests.length < 20 ? false : true}
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
                    <Form initialValues={{address: selectedProfileRequest?.address}} disabled={true} layout="vertical">
                        <Row>
                            <Col span={24}>
                                <Form.Item
                                    label="Address"
                                    name="address"
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: "Insert the address",
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>

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
							<Button danger type="primary" onClick={() => onFinish("rejected",selectedProfileRequest.address, selectedProfileRequest.id)}>
								Reject
							</Button>
							<Button
								type="primary"
								style={{ background: "#74B72E" }}
								onClick={() => onFinish("accepted",selectedProfileRequest.address, selectedProfileRequest.id)}
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
