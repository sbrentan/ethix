import {
	Avatar,
	Card,
	Col,
	Divider,
	Image,
	Progress,
	Row,
	Space,
	Typography,
} from "antd";
import React from "react";
import { useGetPublicProfilesQuery } from "../requests/requestsApiSlice";
import { useNavigate } from "react-router-dom";
import Meta from "antd/es/card/Meta";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

const OrganizationCard = ({ publicProfileId }) => {
	const { publicProfile } = useGetPublicProfilesQuery("publicProfilesList", {
		selectFromResult: ({ data }) => ({
			publicProfile: data?.entities[publicProfileId],
		}),
	});

	const navigate = useNavigate();

	if (publicProfile) {
		return (
			<Card
				hoverable
				onClick={() => navigate(`/organizations/${publicProfile.id}`)}
				style={{ margin: "8px" }}
			>
				<Meta
					avatar={
						<Avatar
							icon={
								publicProfile?.publicImage ? (
									<Image
										src={publicProfile?.publicImage}
										preview={false}
									/>
								) : (
									<UserOutlined />
								)
							}
						/>
					}
					title={publicProfile.publicName}
					description={publicProfile?.publicDescription}
				/>
			</Card>
			// 	<Card title={publicProfile.publicName} hoverable onClick={() => navigate(`/organizations/${publicProfile.id}`)} style={{ margin: '8px'}}>
			// 		<Text>{publicProfile.publicDescription}</Text>
			// 		<br />
			// 	</Card>
		);
	} else return null;
};

export default OrganizationCard;
