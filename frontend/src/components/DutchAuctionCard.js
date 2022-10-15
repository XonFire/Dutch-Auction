import React from "react";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'

export function DutchAuctionCard(props) {
  console.log(
    "hi", props
  )
  const renderCardDetails = () => {
    switch (props.stage) {
      case 0:
        return "0"
      case 1:
        return "1"
      case 2:
        return "2"
    
      default:
        break;
    }
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
          <Typography variant="h5" component="div">
            {renderCardDetails()}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
