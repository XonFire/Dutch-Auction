import React from "react";

import { Button, Typography, Card, Progress, Avatar } from "antd"; 

import { secsToDHMS } from "../helper";

const { Meta } = Card;

const HomePage = (props) => {
  const renderCardDetails = () => {
    switch (props.auctionData.stage) {
      case 0:
        return "Not started";
      case 1:
        return renderAuctionStartCard();
      case 2:
        return renderAuctionEndCard();

      default:
        break;
    }
  };

  const renderAuctionEndCard = () => {
    return (
      <>
        <Typography>
          TUBBY token launch is ended! Total supply:
          {props.auctionData.totalTokens}
          Total sold: {props.auctionData.totalSold}
        </Typography>
        <Button onClick={props.claim}>
          Claim
        </Button>
      </>
    );
  };

  const renderAuctionStartCard = () => {
    const puchasePercent = props.auctionData.totalSold/props.auctionData.totalTokens
    const dhms_map = secsToDHMS(props.auctionData.price)
    return (
      <>
        <Card style={{ width: 600 }}> 
          <h2 style={{textAlign: "center"}}> TUBBY token launch is live! </h2>
          <h4> {puchasePercent}% purchased </h4>
          <Progress percent={puchasePercent * 100} />
          <h4 style={{textAlign: "right"}}> {props.auctionData.totalTokens} TUBBY </h4>
          <h2 style={{textAlign: "center", "margin": "30px"}}>${props.auctionData.price}/TUBBY token</h2>
          <div style={{margin: "40px"}}>
            <Button type="primary" style ={{textAlign: "center", marginLeft: "40%"}} onClick={props.placeBid}>
            Place a bid
            </Button>
            <a style={{display: "block", textAlign: "center", marginTop: "10px"}}> Pay with ETH, USDC </a>
          </div>
          <Meta
            avatar={<Avatar src="https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-logo-6278328_1280.png" />}
            title= {`${dhms_map.d} days, ${dhms_map.h} hours, ${dhms_map.m} minutes, ${dhms_map.s} seconds`}
            description="Until projected auction end"
            style={{marginTop: "30px", fill: "yellow", fillOpacity: "50%"}}
          />
        </Card>
      </>
    );
  };

  return (
    <> 
      <Card variant="outlined" sx={{ width: "33%", height: "60%" }}>
        {renderCardDetails()}
      </Card>
    </>
  );
}


export default HomePage;