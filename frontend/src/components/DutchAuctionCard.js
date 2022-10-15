import React from "react";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'

export function DutchAuctionCard(props) {

  const renderCardDetails = () => {
    switch (props.auctionData.stage) {
      case 0:
        return "Not started"
      case 1:
        return renderAuctionStartCard()
      case 2:
        return "ended"
    
      default:
        break;
    }
  }
  
  const renderAuctionStartCard = () => {
    return (
      <Typography>
      TUBBY token launch is live! 
      Total supply: {props.auctionData.totalTokens}
      Total sold: {props.auctionData.totalSold}
      Price: {props.auctionData.price}
      </Typography>
    )
  }

  return (
    <Box sx = {{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '90vh'
    }}>
      <Card variant="outlined" sx={{ width: "33%", height: "60%" }}>
        <CardContent>
          {renderCardDetails()}

        </CardContent>
      </Card>
    </Box>
  );
}
