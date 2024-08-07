import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Image, Input, Row, Space, theme, Typography } from "antd";
import React, { useState } from "react";
import { Link } from "react-router-dom";

const { Title } = Typography;
const RedeemOverview = () => {
    const [code, setCode] = useState("")

    const { token: styleToken } = theme.useToken();
	const styleContainer = {
		color: styleToken.colorTextTertiary,
		backgroundColor: styleToken.colorBgLayout,//"#eeebe4",
		borderRadius: styleToken.borderRadiusLG,
		border: `1px solid ${styleToken.colorBorder}`,
        width: "80%",
        paddingBottom: 32,
	};


	return (
		<div style={{ backgroundColor:"#bfbab4", padding: 20}}>
			<Row>
				<Col span={12}>
					<Flex justify="center" align="center" style={{ height: "100%", paddingTop: 30}}>
                        <Space direction="vertical"size={25} align="center" style={styleContainer}>
                            <Title level={2}>Do you have a code?</Title>
                            <Input
                                placeholder="Paste the code"
                                size="large"
                                prefix={<QrcodeOutlined />}
                                style={{ minWidth: 300}}
                                onChange={(e) => {setCode(e.target.value)}}
                            />
                            <Link to={`/redeem/${code}`}>
                                <Button type="primary" shape="round" size="large">
                                    Redeem Now
                                </Button>
                            </Link>
                        </Space>
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

export default RedeemOverview;
