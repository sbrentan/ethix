import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRedeemTokenMutation } from "../../context/contextApiSlice";
import { Button, Col, Flex, Image, Result, Row, Space, Spin, theme } from "antd";
import jwtDecode from "jwt-decode";
import { LoadingOutlined } from "@ant-design/icons";

const RedeemPage = () => {
	const [invalidToken, setInvalidToken] = useState(false);
	const [test, setTest] = useState(undefined);
	const [campaignId, setCampaignId] = useState(undefined);

	// id campaign
	const { token } = useParams();
	const [redeemToken, { isLoading, isFetching, isSuccess, isError, error }] =
		useRedeemTokenMutation();

	const { token: styleToken } = theme.useToken();
	const styleContainer = {
		color: styleToken.colorTextTertiary,
		backgroundColor: styleToken.colorBgLayout,//"#eeebe4",
		borderRadius: styleToken.borderRadiusLG,
		border: `1px solid ${styleToken.colorBorder}`,
		marginTop: 16,
        width: "80%",
	};

	useEffect(() => {
		// Only trigger mutation once, even if useEffect fires more times: if there is a result or the token is not a jwt (or expired) no mutation are fired
		if (
			token &&
			!isLoading &&
			!isSuccess &&
			!isError &&
			!isFetching &&
			!invalidToken
		) {
			// verify the token is a valid JWT
			try {
				const decoded = jwtDecode(token);

                // If is not a jwt or is expired (we need to have the date selected)
				if (!decoded) {	// || !decoded.exp || Date.now() > (decoded.exp * 1000)) {
					setInvalidToken(true);
				} else {
					const { campaignId, campaignAddress, tokenId } = decoded;
                    console.log({
                    	campaignId,
                    	campaignAddress,
                    	tokenId,
                    })
                    redeemToken({
                    	campaignId,
                    	campaignAddress,
                    	tokenId,
                    });
					setCampaignId(campaignId);
				}
			} catch (e) {
				setInvalidToken(true);
			}
		}
	}, [token, isLoading, isSuccess, isError, isFetching, invalidToken]);

	const invalidTokenResult = (
		<Result
			status="warning"
			title="The code is invalid or expired."
			extra={[
				<Link to="/home">
					<Button type="primary">Go to Home</Button>
				</Link>,
				<Link to="/redeem">
					<Button>Try Again</Button>
				</Link>,
			]}
		/>
	);

	const errorTokenResult = (
		<Result
			status="error"
			title="Code not redeemed."
			subTitle={`There was an error redeeming the code${
				error ? `: ${error.data.message}.` : `.`
			}`}
			extra={[
				<Link to="/home">
					<Button type="primary">Go to Home</Button>
				</Link>,
				<Link to="/redeem">
					<Button>Try Again</Button>
				</Link>,
			]}
		/>
	);

	const successTokenResult = (
		<Result
			status="success"
			title="Successfully Redeemed the Code!"
			subTitle="Thank you for your Support, we appreciate your Generosity. Check the progress of the campaign below."
			extra={[
				<Link to="/home">
					<Button type="primary">Go to Home</Button>
				</Link>,
				<Link to={`/campaigns/${campaignId}`}>
					<Button>Check the Progress</Button>
				</Link>,
			]}
		/>
	);

	let content = (
		<Result
			icon={<Spin indicator={<LoadingOutlined spin />} size="large" />}
			title="Loading..."
		/>
	);
	if (invalidToken) content = invalidTokenResult;
	else if (isError) content = errorTokenResult;
	else if (isSuccess) content = successTokenResult;

	return (
		// <div style={{ padding: 50, width: "100%", backgroundColor:"#bfbab4", minHeight:521 }}>
		// 	<Space
		// 		direction="vertical"
		// 		align="center"
		// 		style={{ width: "100%", backgroundColor:"#bfbab4" }}
		// 	>
		// 		<div style={styleContainer}>{content}</div>
		// 	</Space>
		// </div>
        <div style={{ backgroundColor:"#bfbab4", padding: 20}}>
			<Row>
				<Col span={12}>
					<Flex justify="center" align="center" style={{ height: "100%", paddingTop: 30}}>
                        <div style={styleContainer}>{content}</div>
					</Flex>
				</Col>
				<Col span={12}>
                <Image
                    
                    preview={false}
                    src="/img/FoundRaisingAi.jpg"
                />
				</Col>
			</Row>
		</div>
	);
};

export default RedeemPage;
