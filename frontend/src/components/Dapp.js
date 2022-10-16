import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
// import TokenArtifact from "../contracts/Token.json";

import contractAddress from "../contracts/contract-address.json";
import DutchAuctionArtifact from "../contracts/DutchAuction.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";
import { Home } from "./Home";
import { BidPage } from "./BidPage";
import { ClaimPage } from "./ClaimPage";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

// This is the Hardhat Network id that we set in our hardhat.config.js.
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = "31337";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // Auction date - stage, start time, discount etc, used for client side calculations
      auctionData: undefined,

      // page (home, bid (3 steps), claim)
      page: "home",

      // will be set when bidding and claiming tokens
      selectedAddress: undefined,

      // TODO error handle
      transactionError: undefined,
      networkError: undefined,
    };

    // The dutch auction object itself. Can either be connected via
    // provider - without an address, so only can get attributes
    // signer - with an address, can make function calls with gas
    this._DutchAuction = undefined;

    this.state = this.initialState;
  }

  renderPage() {
    switch (this.state.page) {
      case "home":
        return (
          <Home
            auctionData={this.state.auctionData}
            placeBid={() => this.setState({ page: "bid" })}
            claim={() => this.setState({ page: "claim" })}
          />
        );
      case "bid":
        return (
          <BidPage
            auctionData={this.state.auctionData}
            connectWallet={() => this._connectWallet()}
            DutchAuction={this._DutchAuction}
            selectedAddress={this.state.selectedAddress}
            returnToHome={() =>
              this.setState({ page: "home", selectedAddress: undefined }, () =>
                this._initializeEthers()
              )
            }
          />
        );
      case "claim":
        return (
          <ClaimPage
            auctionData={this.state.auctionData}
            connectWallet={() => this._connectWallet()}
            selectedAddress={this.state.selectedAddress}
            DutchAuction={this._DutchAuction}
          />
        );
      default:
        return "error";
    }
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (this._DutchAuction === undefined) {
      console.log("missing contract");
      return <Loading />;
    }

    return (
      <Box
        sx={{ display: "flex", "flex-direction": "column", height: "100vh" }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Tubby Coin Dutch Auction
            </Typography>
          </Toolbar>
        </AppBar>
        {this.renderPage()}
      </Box>
    );
  }

  // We connect to the dutch auction on mounting
  componentDidMount() {
    if (!this._checkNetwork()) {
      console.log("Network error");
      return;
    }
    console.log("checked network");
    this._initialize();
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  _initialize() {
    this._initializeEthers();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.

    let providerSigner = this._provider;
    if (this.state.selectedAddress !== undefined) {
      providerSigner = providerSigner.getSigner();
    }

    this._DutchAuction = new ethers.Contract(
      contractAddress.DutchAuction,
      DutchAuctionArtifact.abi,
      providerSigner
    );
    console.log(this._DutchAuction);
  }

  _startPollingData() {
    console.log("Start polling");
    this._pollDataInterval = setInterval(
      () => this._updateAuctionState(),
      1000
    );
    this._updateAuctionState();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _updateAuctionState() {
    const stage = await this._DutchAuction.stage();
    if (stage === 1 || stage === 2) {
      const endTime = await this._DutchAuction.endTime();
      const totalTokens = await this._DutchAuction.totalTokens();
      const totalSold = await this._DutchAuction.totalSold();
      if (endTime < Date.now() / 1000) {
        this.setState({
          auctionData: {
            stage: 2,
            totalSold: totalSold.toNumber(),
            totalTokens: totalTokens.toNumber(),
          },
        });
        return;
      }

      const startTime = await this._DutchAuction.startTime();
      const discountRate = await this._DutchAuction.discountRate();
      const startingPrice = await this._DutchAuction.startingPrice();
      const reservedPrice = await this._DutchAuction.reservedPrice();
      const price = Math.max(
        reservedPrice.toNumber(),
        startingPrice.toNumber() -
          discountRate.toNumber() *
            (Math.floor(Date.now() / 1000) - startTime.toNumber())
      );
      this.setState({
        auctionData: {
          stage: stage,
          discountRate: discountRate.toNumber(),
          startingPrice: startingPrice.toNumber(),
          totalSold: totalSold.toNumber(),
          totalTokens: totalTokens.toNumber(),
          startTime: startTime.toNumber(),
          reservedPrice: reservedPrice.toNumber(),
          endTime: endTime.toNumber(),
          price,
        },
      });
    } else {
      this.setState({ auctionData: { stage } });
    }
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    this.setState({ selectedAddress: selectedAddress }, () =>
      this._initializeEthers()
    );
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545
  _checkNetwork() {
    console.log(window.ethereum.networkVersion);
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({
      networkError: "Please connect Metamask to Localhost:8545",
    });

    return false;
  }
}
