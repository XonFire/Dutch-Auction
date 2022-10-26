# CZ4153-Dutch-Auction
Dutch Auction Contract for CZ4153

Environment was set up as per this tutorial (1 hour): https://hardhat.org/tutorial

# Quick start

If any of the contract code has been edited, they must be recompiled
```
npx hardhat compile
```

To run the localhost node, run the command in the terminal and leave it running
```
npx hardhat node
```

In the terminal, a few test accounts will be generated on the local network. Copy 1 of them and import it into meta mask to have eth to use the contracts
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

In a separate terminal, we deploy our contracts by running 
// todo for now this starts the auction
```
npx hardhat run scripts/deploy.js --network localhost
```

To run front end, run
```
cd frontend
npm i // if this is your first time
npm start
```