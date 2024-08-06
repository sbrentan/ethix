import React, { useEffect, useState } from "react";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import {
	Button,
	Col,
	Empty,
	Input,
	message,
	Modal,
	Row,
	Select,
	Space,
	Table,
	Typography,
} from "antd";
import { format } from "date-fns";
import CampaignCard from "./CampaignCard";

const { Option } = Select;
const { Text, Title } = Typography;

// for the warning: Each child in a list should have a unique "key" prop.
const generateRowKey = (campaign) => {
	// Return a unique identifier for each campaign (e.g., campaign ID)
	return campaign.id;
};

const isExpired = (deadline) => {
	// Convert the date to JS Date
	const expirationDate = new Date(deadline);

	// Get the current date and time
	const now = new Date();

	// Compare the dates
	return now > expirationDate;
};

const CampaignsGrid = () => {
	// state and filters
	const [titleFilter, setTitleFilter] = useState("");
	const [donorFilter, setDonorFilter] = useState("");
	const [receiverFilter, setReceiverFilter] = useState("");
	const [activeFilter, setActiveFilter] = useState("");
	const [filteredCampaigns, setFilteredCampaigns] = useState([]);

    // for antd message
	const [messageApi, contextHolder] = message.useMessage();

	const {
		data: normalizedCampaigns,
		isLoading,
		isFetching,
		isSuccess,
		isError,
		error,
	} = useGetCampaignsQuery("campaignsList", {});

	// When campaigns or the filter change it perform a filters evaluation
	// Filtered result is the ID lists of the filtered campaigns
	useEffect(() => {
		let filteredResult = [];
		if (isSuccess) {
			const { ids, entities } = normalizedCampaigns;
			filteredResult = ids.filter((campaignId, index) => {
				const campaign = entities[campaignId];

				const titleCondition =
					titleFilter === "" ||
					campaign.title
						.toLowerCase()
						.includes(titleFilter.toLowerCase());

				const activeCondition =
					activeFilter === "" ||
					(activeFilter === "true" &&
						!isExpired(campaign.deadline)) ||
					(activeFilter === "false" && isExpired(campaign.deadline));

				// TODO: donor and receiver filter

				return titleCondition && activeCondition && index < 10;
			});
		}
		setFilteredCampaigns(filteredResult);
	}, [
		normalizedCampaigns,
		isSuccess,
		isFetching,
		titleFilter,
		activeFilter,
		donorFilter,
		receiverFilter,
	]);

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
	let tableSource = null;
	let tableContent = <Empty />
	if (isError) {
		errContent = (
			<Text type="danger" strong>
				Errore nella ricezione dei dati: {error?.data?.message}
			</Text>
		);
		//if (!preventPolling) setPreventPolling(true)
	} else if (isSuccess) {
		//if (preventPolling) setPreventPolling(false)
		if (filteredCampaigns.length) {            
            tableContent = (<>
                <Row gutter={[0, 0]}>
                    {filteredCampaigns.map((campaignId) => (
                        <Col key={campaignId} span={12}>
                            <CampaignCard key={campaignId} campaignId={campaignId} />
                        </Col>
                    ))}
                </Row>
            </>)
		}
	}

    return (
        <div style={{ margin: 30 }}>
            {contextHolder}
            <Title>Campaigns</Title>
            {errContent}
            <div>{tableContent}</div>
        </div>
    )
}

export default CampaignsGrid