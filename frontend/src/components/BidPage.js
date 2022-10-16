import React from "react";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from "@mui/material/Button"


import { useState } from 'react';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export function BidPage(props) {

  const [step, setStep] = useState(0) // 0 for place bid, 1 for connect wallet, 2 for confirm
  
  // input field
  const [value, setValue] = useState('')
  const [quantity, setQuantity] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const tx = await props.DutchAuction.bid(parseInt(quantity), {value: parseInt(value)})
      const receipt = await tx.wait() 
      if (receipt.status === 0) {
        throw new Error("Transaction failed")
      }

      let bidSubmission = receipt.events.find(event => event.event === 'BidSubmission')

      console.log("Event from Submit", bidSubmission)

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error)
      
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography>
              Number of Tokens //  TODO Needs check to make sure its positive integer 
            </Typography>
            <TextField variant="outlined" value={quantity} onChange={(e) => setQuantity(e.target.value)}/>
            <Typography>
              Bid amount
            </Typography>
            <TextField variant="outlined" value={value} onChange={(e) => setValue(e.target.value)}/>
            <Button variant="contained" onClick={()=>setStep(1)}>Continue</Button>
          </Box>
        ) 
      case 1:
        return (
          <Box>
            <Typography>
              Connect wallet
            </Typography>
            
            
            <Button variant="contained" onClick={()=>{
              props.connectWallet(address)
            }}>Connect Wallet</Button>
            <Typography>
              Your address: {props.selectedAddress}
            </Typography>
            <Button variant="contained" disabled={props.selectedAddress === undefined} onClick={()=>{
              setStep(2)
            }}>Continue</Button>
          </Box>
        ) 
      case 2:
        return (
          <Box>
            <Typography>
              Confirm
            </Typography>
            <Button variant="contained" onClick={()=>handleConfirm()}>Confirm</Button>
          </Box>
        ) 
      default:
        break;
    }
  }

  return (
    <Box sx = {{
      flex: 1,
      height: "100%",
      display: 'flex',
      flexDirection: "row"
    }}>
      <Box sx={{flex: 1, }}>{renderStep()}</Box>
      <Box sx={{
        flex: 1, 
        display: 'flex',  
        backgroundColor: "#CCCCCC", 
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <Card variant="outlined" sx={{ width: "66%", height: "60%" }}>
          <CardContent>
            <Typography>
              Bid amount: {value}, you will receive: {quantity}
            </Typography>
          </CardContent>
        </Card>
      </Box>
      
    </Box>
  );
}
