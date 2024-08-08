import React, { useEffect, useState } from "react";
import { useGetPublicProfilesQuery } from "../requests/requestsApiSlice";
import { Col, Empty, message, Row, Typography } from "antd";
import OrganizationCard from "./OrganizationCard";

const { Text, Title } = Typography;

const OrganizationsGrid = () => {
	const [filteredPublicProfiles, setFilteredPublicProfiles] = useState([]);

	// for antd message
	const [messageApi, contextHolder] = message.useMessage();

	const {
		data: normalizedPublicProfiles,
		isLoading,
		isFetching,
		isSuccess,
		isError,
		error,
	} = useGetPublicProfilesQuery("publicProfilesList", {});

	// I filter out empty organizations
	useEffect(() => {
		let filteredResult = [];
		if (isSuccess) {
			const { ids, entities } = normalizedPublicProfiles;
			filteredResult = ids.filter((publicProfileId, index) => {
				const publicProfile = entities[publicProfileId];

				const emptyCondition =
					publicProfile?.publicName &&
					publicProfile.publicName !== "";

				return emptyCondition;
			});
		}
		setFilteredPublicProfiles(filteredResult);
	}, [normalizedPublicProfiles, isSuccess, isFetching]);

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

	let errContent = null;
	let tableContent = <Empty />;
	if (isError) {
		errContent = (
			<Text type="danger" strong>
				Error receiving data: {error?.data?.message}
			</Text>
		);
		//if (!preventPolling) setPreventPolling(true)
	} else if (isSuccess) {
		//if (preventPolling) setPreventPolling(false)
		if (filteredPublicProfiles.length) {
			tableContent = (
				<>
					<Row gutter={[0, 0]}>
						{filteredPublicProfiles.map((publicProfileId) => (
							<Col key={publicProfileId} span={12}>
								<OrganizationCard
									key={publicProfileId}
									publicProfileId={publicProfileId}
								/>
							</Col>
						))}
					</Row>
				</>
			);
		}
	}

	return (
		<div style={{ margin: 30 }}>
			{contextHolder}
			<Title>Organizations</Title>
			{errContent}
			<div>{tableContent}</div>
		</div>
	);
};

export default OrganizationsGrid;
