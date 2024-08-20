import React, { useEffect, useState } from "react";
import { useGetCampaignsQuery } from "./campaignsApiSlice";
import {
	Button,
	Carousel,
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
import { RightOutlined, LeftOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
import CampaignCard from "./CampaignCard";
import { Link } from "react-router-dom";

const { Option } = Select;
const { Text, Title } = Typography;

const SampleNextArrow = (props) => {
	const { className, style, onClick } = props;
	return (
		<div
			className={className}
			style={{
				...style,
				color: "black",
				fontSize: "15px",
				lineHeight: "1.5715",
			}}
			onClick={onClick}
		/>
	);
};

const SamplePrevArrow = (props) => {
	const { className, style, onClick } = props;
	return (
		<div
			className={className}
			style={{
				...style,
				color: "black",
				fontSize: "15px",
				lineHeight: "1.5715",
			}}
			onClick={onClick}
		/>
	);
};

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

const contentStyle = {
	margin: 0,
	height: "160px",
	color: "#fff",
	lineHeight: "160px",
	textAlign: "center",
	background: "#364d79",
};

const CampaignsCarousel = ({ organization = "", name = ""}) => {
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
	// Filtered result is the ID lists of the filtered bookings
	useEffect(() => {
		let filteredResult = [];
		if (isSuccess) {
			const { ids, entities } = normalizedCampaigns;
			filteredResult = ids.filter((campaignId) => {
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
                const organizationCondition = organization === "" || organization === campaign.donor || organization === campaign.receiver

				return titleCondition && activeCondition && organizationCondition;
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

    const settings = organization !== "" ?
    {
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
    }
    : {
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: false,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    initialSlide: 1,
                },
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    initialSlide: 1,
                },
            },
        ],
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
    };

	let tableContent = <Empty />;
	if (isSuccess) {
		//if (preventPolling) setPreventPolling(false)
		if (filteredCampaigns.length) {
			tableContent = (
				<Carousel arrows {...settings} style={{ padding: "0 30px" }}>
					{filteredCampaigns
						.filter((entity, index) => entity !== undefined && index < 10)
						.map((campaignId) => (
							<div key={campaignId}>
								<CampaignCard
									key={campaignId}
									campaignId={campaignId}
								/>
							</div>
						))}
				</Carousel>
			);
		}
	}

	return (
		<div style={{ margin: 30 }}>
			{contextHolder}
			<Space
				direction="vertical"
				align="center"
				style={{ width: "100%" }}
				size={0}
			>
				<Title level={2}>{organization ? `Ongoing Campaigns of ${name}` : "Ongoing Campaigns"}</Title>
				<Link to="/campaigns">
					<Title underline level={4} style={{ margin: 5 }}>
						See All
					</Title>
				</Link>
			</Space>
			<div style={{ margin: 10 }}>{tableContent}</div>
		</div>
	);
};

export default CampaignsCarousel;
