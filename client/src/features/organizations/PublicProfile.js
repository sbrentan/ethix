import React from "react";
import {
	Col,
	Form,
	Row,
	Typography,
	Input,
	Image,
	Flex,
	Space,
	Button,
	message,
	Card,
	theme,
	Divider,
} from "antd";
import { useGetPublicProfilesQuery } from "../requests/requestsApiSlice";
import { Link, useParams } from "react-router-dom";
import NotFoundResult from "../../components/NotFoundResult";
import CampaignsCarousel from "../campaigns/CampaignsCarousel";

const { Text, Title } = Typography;

const PublicProfile = () => {
	// id campaign
	const { id } = useParams();

	const { publicProfile, isPublicProfileLoading } = useGetPublicProfilesQuery(
		"publicProfilesList",
		{
			selectFromResult: ({ data }) => ({
				publicProfile: data?.entities[id],
			}),
		}
	);

	const { token: styleToken } = theme.useToken();
	const styleContainer = {
		color: styleToken.colorTextTertiary,
		backgroundColor: styleToken.colorBgLayout, //"#eeebe4",
		borderRadius: styleToken.borderRadiusLG,
		border: `1px solid ${styleToken.colorBorder}`,
		width: "80%",
		paddingBottom: 32,
	};

	if (!publicProfile)
		return (
			<>
				<NotFoundResult subTitle="The Organization you are looking for cannot be found" />
			</>
		);

	return (
		<div style={{ margin: 30 }}>
			<Flex justify="center">
				<Row gutter={10} justify="center" style={{ maxWidth: "1000px" }}>
					<Col span={24}>
						<Card>
							<Flex justify="center">
								<Image
									src={
										publicProfile.publicImage
											? publicProfile.publicImage
											: "error"
									}
									style={{ maxWidth: "400px" }}
									preview={
										publicProfile.publicImage?.image ? true : false
									}
								/>
							</Flex>
						</Card>
						<Card>
							<Title>{publicProfile.publicName}</Title>
							<Divider />
							<Text>{publicProfile.publicDescription}</Text>
						</Card>
						<Card>
							<CampaignsCarousel
								organization={publicProfile.user}
								name={publicProfile.publicName}
							/>
						</Card>
					</Col>
				</Row>
			</Flex>
		</div>
	);
};

export default PublicProfile;
