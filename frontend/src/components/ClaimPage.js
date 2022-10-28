import React, { useState, useEffect } from "react";

import { Row, Col, Avatar, Card, Button, Result } from "antd";
const { Meta } = Card;

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const ClaimPage = (props) => {
  // input field
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tokens, setTokens] = useState(0);
  const [bids, setBids] = useState(0);

  useEffect(() => {
    const getTokens = async () => {
      let order = await props.DutchAuction.orders(props.selectedAddress);
      let bids = await props.DutchAuction.bids(props.selectedAddress);

      let estimatedGas = await props.DutchAuction.estimateGas.claimTokens();

      order = order.toNumber();
      if (order > 0) {
        setTokens(order);
        setBids(bids.toNumber());
      }
    };
    getTokens();
  }, [props.selectedAddress]);

  const renderWalletClaim = () => (
    <>
      <div style={{margin: "20px"}}>
        <h2> Connnect your Metamask Wallet </h2>
        <Button
          type="default"
          onClick={props.connectWallet}
        >
          Connect Wallet
        </Button>
      </div>
      <div style={{margin: "20px"}}>
        {
          props.selectedAddress && <Card>
          <Meta
            avatar={<Avatar src="https://play-lh.googleusercontent.com/8rzHJpfkdFwA0Lo6_CHUjoNt8OU3EyIe9BZNKGqj0C8BhleguW9LhXHbS46FAtLAJ9r2" />}
            title= "Your Wallet Address"
            description={props.selectedAddress}
            style={{marginTop: "30px", fill: "yellow", fillOpacity: "50%"}}
          />
          <Meta
            avatar={<Avatar src="https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-logo-6278328_1280.png" />}
            title= {`You have ${tokens} to claim`}
            description={`Your bid is ${bids}`}
            style={{marginTop: "30px", fill: "yellow", fillOpacity: "50%"}}
          />
        </Card>
        }
      </div>
      <div style={{margin: "20px"}}>
        <Button
          type="primary"
          disabled={props.selectedAddress === undefined || tokens === 0}
          onClick={handleClaim}
        >
          Claim
        </Button>
      </div> 
    </>
  )

  const handleClaim = async () => {
    setLoading(true);
    try {
      const tx = await props.DutchAuction.claimTokens();
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      setMessage( 
        <Result
          status="Success"
          title="Successfully claimed tokens"
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
          title="Claim failed"
        />
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <> 
      <Row style={{margin: "20px"}}>
        <Col span={12}>
          {renderWalletClaim()}
        </Col>
        <Col span={12}>
          <div style={{margin: "20px"}}> 
            {message}
          </div>
        </Col>
      </Row>     
  </>
  );
}

export default ClaimPage;