import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
// import TokenArtifact from "../contracts/Token.json";

import contractAddress from "../contracts/contract-address.json";
import DutchAuctionArtifact from "../contracts/DutchAuction.json"

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";

import { DutchAuctionCard } from "./DutchAuctionCard"
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

// This is the Hardhat Network id that we set in our hardhat.config.js.
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = '1337';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // Auction date - stage, start time, discount, 
      auctionData: undefined,

      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };

    // We check if app is connected to Dutch Auction
    this._DutchAuction = undefined

    this.state = this.initialState;
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (this._DutchAuction === undefined) {
      console.log("missing contract")
      return <Loading />
    }

    // // The next thing we need to do, is to ask the user to connect their wallet.
    // // When the wallet gets connected, we are going to save the users's address
    // // in the component's state. So, if it hasn't been saved yet, we have
    // // to show the ConnectWallet component.
    // //
    // // Note that we pass it a callback that is going to be called when the user
    // // clicks a button. This callback just calls the _connectWallet method.
    // if (!this.state.selectedAddress) {
    //   return (
    //     <ConnectWallet 
    //       connectWallet={() => this._connectWallet()} 
    //       networkError={this.state.networkError}
    //       dismiss={() => this._dismissNetworkError()}
    //     />
    //   );
    // }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    // if (!this.state.tokenData || !this.state.balance) {
    //   return <Loading />;
    // }
    
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Tubby Coin Dutch Auction
            </Typography>
          </Toolbar>
        </AppBar>
        <DutchAuctionCard auctionData={this.state.auctionData}/>
      </Box>
      
    
    )
  }

  componentDidMount() {
    if (!this._checkNetwork()) {
      return;
    }
    console.log("checked network")
    this._initialize()
  }

  componentWillUnmount() {
    this._stopPollingData();
  }


  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // // We reinitialize it whenever the user changes their account.
    // window.ethereum.on("accountsChanged", ([newAddress]) => {
    //   this._stopPollingData();
    //   // `accountsChanged` event can be triggered with an undefined newAddress.
    //   // This happens when the user removes the Dapp from the "Connected
    //   // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
    //   // To avoid errors, we reset the dapp state 
    //   if (newAddress === undefined) {
    //     return this._resetState();
    //   }
      
    //   this._initialize(newAddress);
    // });
    
    // We reset the dapp state if the network is changed
    // window.ethereum.on("chainChanged", ([networkId]) => {
    //   this._stopPollingData();
    //   this._resetState();
    // });
  }

  _initialize() {

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    // this._getTokenData();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._DutchAuction = new ethers.Contract(
      contractAddress.DutchAuction,
      DutchAuctionArtifact.abi,
      this._provider
    );
    console.log(this._DutchAuction)
  }

  _startPollingData() {
    console.log("Start polling")
    this._pollDataInterval = setInterval(() => this._updateAuctionState(), 1000);
    this._updateAuctionState();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }
  
  async _updateAuctionState() {
    const stage = await this._DutchAuction.stage();
    if (stage === 1) {
      // for now
      const endTime = await this._DutchAuction.endTime();
      if (endTime < Date.now() / 1000) {
        this.setState({
          auctionData: {stage: 2}
        })
        return
      }
      
      const startTime = await this._DutchAuction.startTime();
      const discountRate = await this._DutchAuction.discountRate();
      const startingPrice = await this._DutchAuction.startingPrice();
      const totalTokens = await this._DutchAuction.totalTokens();
      const totalSold = await this._DutchAuction.totalSold();
      const reservedPrice = await this._DutchAuction.reservedPrice();
      const price = Math.max(reservedPrice.toNumber(), startingPrice.toNumber() - discountRate.toNumber() * (Math.floor(Date.now() / 1000) - startTime.toNumber()))
      this.setState({auctionData: {
        stage: stage,
        discountRate: discountRate.toNumber(), 
        startingPrice: startingPrice.toNumber(), 
        totalSold: totalSold.toNumber(), 
        totalTokens: totalTokens.toNumber(),
        startTime: startTime.toNumber(),
        reservedPrice: reservedPrice.toNumber(),
        endTime: endTime.toNumber(), 
        price
      }})
      
    } else {
      this.setState({ auctionData: {stage} });
    }
  }
  // The next two methods just read from the contract and store the results
  // in the component state.
  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();

    this.setState({ tokenData: { name, symbol } });
  }


  // This method sends an ethereum transaction to transfer tokens.
  // While this action is specific to this application, it illustrates how to
  // send a transaction.
  async _transferTokens(to, amount) {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    //
    // This method handles all of those things, so keep reading to learn how to
    // do it.

    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      this._dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await this._token.transfer(to, amount);
      this.setState({ txBeingSent: tx.hash });

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._updateBalance();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
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
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }
}
