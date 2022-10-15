# CZ4153-Dutch-Auction
Dutch Auction Contract for CZ4153

Environment was set up as per this tutorial (1 hour): https://hardhat.org/tutorial

# Quick start
To run the localhost node, run the command in the terminal and leave it running
```
npx hardhat node
```

In a separate terminal, we deploy our contracts by running 
```
npx hardhat run scripts/deploy.js --network localhost
```

Currently, theres no UI to start the auction, so we run the script: TODO
```
npx hardhat run scripts/startAuction.js --network localhost
```
To run front end, run
```
cd frontend
npm start
```