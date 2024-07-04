import React from "react";
import { useGetMyProfileRequestsQuery } from "./requestsApiSlice";
import { Button, Space, Typography } from "antd";
import useAuth from "../../hooks/useAuth";
import DonorProfile from "../../components/DonorProfile";
import BeneficiaryProfile from "../../components/BeneficiaryProfile";
import { CheckCircleTwoTone } from "@ant-design/icons";

const { Text, Title } = Typography;

const MyProfileRequest = () => {
	// GET MY PROFILE
	const {
		data: request,
		isLoading: isRequestLoading,
		isSuccess: isRequestSuccess,
		isError: isRequestError,
		error: requestError,
		refetch: refetchRequest,
	} = useGetMyProfileRequestsQuery();

	const { isDonor, isBeneficiary, verified: v } = useAuth();
	const verified = false;

	if (!request) return <p>Waiting for data...</p>;

	const description = (
		<Text>
			{verified
				? "Your account has been verified."
				: "Your account is not yet verified. Check your latest request below."}
		</Text>
	);

	let content = <></>;
	if (verified) {
		content = (
			<>
				{isDonor && <DonorProfile profile={request.donorData} />}
				{isBeneficiary && (
					<BeneficiaryProfile profile={request.beneficiaryData} />
				)}
			</>
		);
	} else {
		content = (
			<>
                {
                    (request.state === "rejected" &&
                        <><br/>
						<Text type="danger">Your request has been rejected.</Text>
                        </>
					)
                }
				{isDonor && <DonorProfile profile={request.donorData} />}
				{isBeneficiary && (
					<BeneficiaryProfile profile={request.beneficiaryData} />
				)}
				{
					(request.state === "rejected" && (
						<div style={{ width: "300px", margin: "0 auto" }}>
							<Button type="primary" htmlType="submit" block disabled>
								Create new request
							</Button>
						</div>
					))
				}
			</>
		);
	}
	// am I verified ?
	// try to get profile
	// try to get Profile request
	return (
		<div style={{ marginLeft: "0.8rem", marginTop: "0.8rem" }}>
			<Space direction="horizontal">
				<Title>Profile</Title>
				{verified && (
					<CheckCircleTwoTone style={{ fontSize: "150%" }} />
				)}
			</Space>
			<br />
			{description}
			{content}
		</div>
	);
};

export default MyProfileRequest;
