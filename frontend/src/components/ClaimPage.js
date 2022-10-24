import React, { useState, useEffect } from "react";

import Loading from "./Loading";
import { Card, Button, Typography } from "antd";

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

  const handleClaim = async () => {
    setLoading(true);
    try {
      const tx = await props.DutchAuction.claimTokens();
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      setMessage("Successfully claimed tokens");
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      setMessage("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      sx={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Card>
        <Typography>Connect wallet</Typography>

        <Button
          variant="contained"
          onClick={() => {
            props.connectWallet();
          }}
        >
          Connect Wallet
        </Button>
        <Typography>Your address: {props.selectedAddress}</Typography>
        <Typography>You have {tokens} to claim</Typography>
        <Typography>Your bid is {bids} </Typography>
        <Typography>{message}</Typography>
        <Button
          disabled={tokens === 0}
          variant="contained"
          onClick={() => {
            handleClaim();
          }}
        >
          Claim
        </Button>

        {loading ? <Loading /> : <></>}
      </Card>
    </Card>
  );
}

export default ClaimPage;