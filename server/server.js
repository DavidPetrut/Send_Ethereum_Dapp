const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Web3 } = require("web3");
const WebsocketProvider = require("web3-providers-ws");
const contractABI = require("../build/contracts/TransactionLogger.json");
const contractAddress = "0x1dE0aB01CCe1784f9864660f102c0470F75356aD";
require("dotenv").config({ path: "../.env" });
const HDWalletProvider = require("@truffle/hdwallet-provider");

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const mnemonic = process.env.MNEMONIC;
const infuraProjectId = process.env.INFURA_PROJECT_ID;

const infuraUrl = `https://sepolia.infura.io/v3/${infuraProjectId}`;

const provider = new HDWalletProvider(mnemonic, infuraUrl);
const web3 = new Web3(provider);

const contract = new web3.eth.Contract(contractABI.abi, contractAddress);

app.get("/", (req, res) => {
  res.send("Server is running");
});

contract.events.EtherTransfer({ fromBlock: "latest" }, (error, event) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log(event);
  io.emit("EtherTransfer", event);
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.post("/sendEther", async (req, res) => {
  const { recipient, amount } = req.body;
  try {
    const fromAccount = (await web3.eth.getAccounts())[0];
    const tx = await contract.methods.sendEther(recipient).send({
      from: fromAccount,
      value: web3.utils.toWei(amount, "ether"),
      gas: 2000000,
    });

    const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
    const transaction = await web3.eth.getTransaction(tx.transactionHash);
    const gasCost = web3.utils.fromWei(
      (receipt.gasUsed * transaction.gasPrice).toString(),
      "ether"
    );

    res.json({
      success: true,
      txHash: tx.transactionHash,
      recipient: recipient,
      amount: amount,
      gasUsed: receipt.gasUsed.toString(),
      gasCost: gasCost.toString(),
    });
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ success: false, message: "Transaction failed" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
