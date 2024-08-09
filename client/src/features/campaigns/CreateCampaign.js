import { Button, Form, Input, InputNumber, message, Select, DatePicker, Col, Typography, Row } from "antd";
import React, { useEffect, useState, useContext } from "react";
import { useGetBeneficiariesQuery } from "./campaignsApiSlice";
import useAuth from "../../hooks/useAuth";
import web3 from 'web3';
import { useEthPrice } from "use-eth-price";
import { TransactionContext } from ".//../../context/TransactionContext.js";
import MetamaskButton from ".//../../components/MetamaskButton.js";



const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const CreateCampaign = ({ setSuccessCreation }) => {
	const [form] = Form.useForm();

    const {
      wallet,
      createCampaign,
    } = useContext(TransactionContext);


    // for antd message
	const [messageApi, contextHolder] = message.useMessage();

  const { ethPrice, loading, errorEth } = useEthPrice("eur");

  //const [formDisabled, setformDisabled] = useState(true);

  let formDisabled = true;

  const suffixSelector = (
    <Form.Item name="suffix" noStyle>
      €
    </Form.Item>
  );
  
  const suffixSelectorETH = (
    <Form.Item name="suffix" noStyle>
      ETH
    </Form.Item>
  );
	const {
		data: beneficiaries,
		isLoadingBen,
		isFetchingBen,
		isSuccessBen,
		isErrorBen,
		errorBen,
	} = useGetBeneficiariesQuery("beneficiaries", {});

const [targetEth,setTargetEth] = useState(null)

function range(start, end) {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
}
  const { username } = useAuth()

    const handleSubmit = async (values) => {
		  const { title, image, dates, description, receiverId, tokenAmount }  = values;
      const startDate = dates[0];
      const deadline = dates[1];
      const seed = web3.utils.randomHex(32);
      let target = targetEth;
      let donor = useAuth.userId;
      
      const benef = beneficiaries.filter(user =>
        user._id === receiverId
      );   
      const receiver = benef[0].address;
      const response = await createCampaign(title, description, image, startDate, deadline, targetEth, tokenAmount, donor, receiverId, receiver)
      setSuccessCreation(response === true)
	};

	return (
		<>
    {!wallet.is_logged && (
      <MetamaskButton></MetamaskButton>
    )}
    {wallet.is_logged && (
      <p>Connected wallet: {wallet.address}</p>
      ) && (formDisabled = false)}


      {contextHolder}
			<Form form={form} layout="vertical" onFinish={handleSubmit} disabled={formDisabled}>
      <Title level={5}>New Campaign data</Title>
      
				<Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Amount"
              name="targetEur"
              rules={[
                {
                  required: true,
                  message: "Insert money amount",
                },
              ]}
            >
              <InputNumber
              onChange={(e) => setTargetEth(e/ethPrice)}
                placeholder={"Insert money amount"}
                autoComplete="off"
                style={{
                  width: '100%',
                }}
                addonAfter={suffixSelector}

              />
            </Form.Item>
          </Col>
          <Col span={4}>
          <Form.Item 
              label="ETH Amount"
              name="targetEth"
              rules={[
                {
                  required: false,
                  message: "Insert money amount",
                },
              ]}
            >
              <InputNumber disabled
                placeholder={targetEth}
                addonAfter={suffixSelectorETH}
      
              />
            </Form.Item>
          </Col>
          <Col span={8}>
          <Form.Item 
              label="Token Amount"
              name="tokenAmount"
              rules={[
                {
                  required: true,
                  message: "Insert money amount",
                },
              ]}
            >
              <InputNumber  
                style={{
                  width: '100%',
                }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Title"
              name="title"
              rules={[
                {
                  required: true,
                  message: "Insert valid title",
                },
              ]}
            >
              <Input placeholder={"Insert campaign title"} />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="Description"
              name="description"
              rules={[
                {
                  required: false,
                  message: "Insert description",
                },
              ]}
            >
              <Input placeholder={"Insert campaign description"} />
            </Form.Item>
          </Col>  
        </Row>
        <Row gutter={16}>  
          <Col span={24}>
            <Form.Item
              label="Starting Date"
              name="dates"
              rules={[
                {
                  required: true,
                  message: "Insert valid starting and finish date",
                },
              ]}
            >
            <RangePicker showTime
              style={{
                width: '100%',
              }}
            // disabledDate={(current) => {
            //   return current && current.valueOf() < Date.now();

            // }}
            />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>  
          <Col span={12}>
            <Form.Item
                label="Image"
                name="image"
                rules={[
                  {
                    required: false,
                    message: "Insert valid title",
                  },
                ]}
              >
                <Input placeholder={"Insert campaign image"} />
            </Form.Item>
           </Col>
          <Col span={12}>
            <Form.Item label="Select"
                name="receiverId"
                rules={[
                  {
                    required: true,
                    message: "Select valid beneficiary",
                  },
                ]}>
              <Select>
              {
                beneficiaries!= undefined && beneficiaries.map((user) => (
                    <Select.Option key={user._id} value={user._id}>{user.username}</Select.Option>
                ))
                }
              </Select>
          </Form.Item>
         </Col>
        </Row>
                <br/>
				<div style={{ width: "300px", margin: "0 auto" }}>
					<Button type="primary" htmlType="submit" block>
						Confirm
					</Button>
				</div>
                <br/>
			</Form>
		</>
	);
};

export default CreateCampaign;
