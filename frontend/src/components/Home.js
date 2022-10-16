import React from "react";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'
import Button from "@mui/material/Button"

export function Home(props) {

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
      <>
        <Typography>
        TUBBY token launch is live! 
        Total supply: {props.auctionData.totalTokens}
        Total sold: {props.auctionData.totalSold}
        Price: {props.auctionData.price}
        </Typography>
        <Button variant="contained" onClick={props.placeBid}>Place a bid</Button>
      </>
    )
  }

  return (
    <Box sx = {{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
    }}>
      <Card variant="outlined" sx={{ width: "33%", height: "60%" }}>
        <CardContent>
          <Typography>
            Sorry this is still ugly // TODO
          </Typography>
          {renderCardDetails()}

        </CardContent>
      </Card>
    </Box>
  );
}
