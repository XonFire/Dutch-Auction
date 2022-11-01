import React, { useState } from "react";

import Loading from "./Loading";
import {
  Avatar,
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Result,
  Steps,
} from "antd";
import { ethers } from "ethers";
const { Step } = Steps;
const { Meta } = Card;

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const BidPage = (props) => {
  const steps = [
    "Place a bid",
    "Connect Wallet",
    "Payment",
    "Confirm Transaction",
  ];
  const [step, setStep] = useState(0); // 0 for place bid, 1 for connect wallet, 2 for confirm, 3 for done

  // input field
  const [value, setValue] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isBidValid = quantity > 0 && value > 0;
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const tx = await props.DutchAuction.bid(parseInt(quantity), {
        value: ethers.utils.parseEther("" + value),
      });
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      let bidSubmission = receipt.events.find(
        (event) => event.event === "BidSubmission"
      );

      console.log("Event from Submit", bidSubmission);
      setMessage(
        <Result
          status="success"
          title="Successfully bought TUBBY"
          subTitle={`${bidSubmission.args.quntity.toString()} TUBBY purchased for ${bidSubmission.args.amount.toString()} with ${bidSubmission.args.bidder.toString()}`}
          extra={[
            <Button type="primary" onClick={props.returnToHome}>
              {" "}
              Back Home{" "}
            </Button>,
          ]}
        />
      );
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      setMessage(
        <Result
          status="500"
          title="Transaction Failed"
          subTitle="Please check and resubmit the transaction"
          extra={[
            <Button type="primary" onClick={props.returnToHome}>
              {" "}
              Back Home{" "}
            </Button>,
          ]}
        />
      );
    } finally {
      setLoading(false);
      setStep(3);
    }
  };

  const renderStep = () => {
    if (loading) {
      return <Loading />;
    }
    switch (step) {
      case 0:
        return (
          <>
            <h2> Place a bid </h2>
            <div style={{ marginTop: "20px" }}>
              <h4> Number of Tokens </h4>
              <InputNumber min={0} value={quantity} onChange={setQuantity} />
            </div>
            <div style={{ marginTop: "20px" }}>
              <h4> Bid amount in ETH </h4>
              <InputNumber min={0} value={value} onChange={setValue} />
            </div>
            <div style={{ marginTop: "20px" }}>
              {isBidValid ? (
                <Button type="primary" onClick={() => setStep(1)}>
                  Continue
                </Button>
              ) : (
                <Button disabled type="primary" onClick={() => setStep(1)}>
                  Continue
                </Button>
              )}
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div style={{ margin: "20px" }}>
              <h2> Connnect your Metamask Wallet </h2>
              <Button type="default" onClick={props.connectWallet}>
                Connect Wallet
              </Button>
            </div>
            <div style={{ margin: "20px" }}>
              {props.selectedAddress && (
                <Card>
                  <Meta
                    avatar={
                      <Avatar src="https://play-lh.googleusercontent.com/8rzHJpfkdFwA0Lo6_CHUjoNt8OU3EyIe9BZNKGqj0C8BhleguW9LhXHbS46FAtLAJ9r2" />
                    }
                    title="Your Wallet Address"
                    description={props.selectedAddress}
                    style={{
                      marginTop: "30px",
                      fill: "yellow",
                      fillOpacity: "50%",
                    }}
                  />
                </Card>
              )}
            </div>
            <div style={{ margin: "20px" }}>
              <Button
                type="primary"
                disabled={props.selectedAddress === undefined}
                onClick={() => {
                  setStep(2);
                }}
              >
                Continue
              </Button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div style={{ margin: "20px" }}>
              <h2> Confirm your registered wallet </h2>
              <Button type="primary" onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div style={{ margin: "20px" }}>{message}</div>
          </>
        );
      default:
        break;
    }
  };

  const getStepComponent = (stepIdx, stepTitle) => {
    if (stepIdx < step) return <Step status="finish" title={stepTitle} />;
    else if (stepIdx == step)
      return <Step status="process" title={stepTitle} />;
    else return <Step status="wait" title={stepTitle} />;
  };

  return (
    <div style={{ margin: "40px" }}>
      <Steps>
        {steps.map((stepTitle, idx) => getStepComponent(idx, stepTitle))}
      </Steps>
      <Row style={{ margin: "50px" }}>
        <Col span={12}>
          <Card style={{ margin: "10px" }}>{renderStep()}</Card>
        </Col>
        <Col span={12}>
          {(value || quantity) && (
            <Card style={{ margin: "10px" }}>
              <Card title="Transaction Summary" bordered={false}>
                <h4> Bid amount in ETH: {value} </h4>
                <h4> You will receive: {quantity} </h4>
              </Card>
              {props.selectedAddress && (
                <Card bordered={false}>
                  <Meta
                    avatar={
                      <Avatar src="https://play-lh.googleusercontent.com/8rzHJpfkdFwA0Lo6_CHUjoNt8OU3EyIe9BZNKGqj0C8BhleguW9LhXHbS46FAtLAJ9r2" />
                    }
                    title="You will receive TUBBY tokens to"
                    description={props.selectedAddress}
                    style={{
                      marginTop: "30px",
                      fill: "yellow",
                      fillOpacity: "50%",
                    }}
                  />
                </Card>
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default BidPage;
