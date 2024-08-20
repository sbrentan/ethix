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
			<Row gutter={10}>
				<Col span={16}>
					<Card>
						<Image
							src={
								publicProfile.publicImage
									? publicProfile.publicImage
									: "error"
							}
							width={"100%"}
							heigth={"100%"}
							preview={
								publicProfile.publicImage?.image ? true : false
							}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Space
						size={10}
						direction="vertical"
						style={{ display: "flex", height: "100%" }}
					>
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
					</Space>
				</Col>
			</Row>
		</div>
	);
};

export default PublicProfile;
