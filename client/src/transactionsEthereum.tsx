import { useState, useEffect } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import io from "socket.io-client";
import TransactionLoggerABI from "../../build/contracts/TransactionLogger.json"; 
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBitcoin } from '@fortawesome/free-brands-svg-icons';


interface LogEntry {
  [key: string]: any; 
}


interface TransactionInfo {
  recipient: string;
  amount: string;
  gasUsed: any;
  gasCost: any;
  txHash: string;
}


const contractAddress = "0x1dE0aB01CCe1784f9864660f102c0470F75356aD"; 

function SendEther() {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [transactionInfo, setTransactionInfo] = useState<TransactionInfo | null>(null);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 



   const displayAlert = (message: string, success = false) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
    if (success) setIsLoading(false); 
  };


  
  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("EtherTransfer", (event: LogEntry) => {
      console.log("Ether Transfer Event:", event);
      setLogs((currentLogs) => [...currentLogs, event]);
    });
    return () => {
      socket.off("EtherTransfer");
    };
  }, []);


  useEffect(() => {
    const isConnected = localStorage.getItem('walletConnected') === 'true';
    setWalletConnected(isConnected);
  
    const checkWalletConnection = async () => {
      const provider: any = await detectEthereumProvider();
      if (provider) {
        provider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            const wasConnected = localStorage.getItem('walletConnected') === 'true';
            if (wasConnected) {
              setWalletConnected(true);
              localStorage.setItem('walletConnected', 'true');
            }
          } else {
            setWalletConnected(false);
            localStorage.setItem('walletConnected', 'false');
          }
        });
      }
    };
    checkWalletConnection();
  }, []);
  


  const connectWallet = async () => {
    const provider: any = await detectEthereumProvider();
    if (provider && provider.request) {
      await provider.request({ method: 'eth_requestAccounts' });
      setWalletConnected(true);
      localStorage.setItem('walletConnected', 'true');
    }
  };
  

  const disconnectWallet = () => {
    setWalletConnected(false);
    window.localStorage.setItem('walletConnected', 'false');
  };
  

  useEffect(() => {
    const isConnected = window.localStorage.getItem('walletConnected') === 'true';
    setWalletConnected(isConnected);
  }, []);


  async function sendEther() {
    if (!recipient || !amount) {
      displayAlert("All fields must be filled!");
      return;
    }


    setIsLoading(true);

    const provider:any = await detectEthereumProvider();
    if (provider) {
      await provider.request({ method: "eth_requestAccounts" });
      const web3 = new Web3(provider);
      const transactionLoggerContract = new web3.eth.Contract(TransactionLoggerABI.abi, contractAddress);
  
      const accounts = await web3.eth.getAccounts();
      const sendAmountInWei = web3.utils.toWei(amount, "ether");
  
      try {
        const txReceipt = await transactionLoggerContract.methods.sendEther(recipient).send({
          from: accounts[0],
          value: sendAmountInWei,
        });
        console.log("Transaction Receipt:", txReceipt);
        displayAlert("Transaction successful!");
        setIsLoading(false);
      } catch (error) {
        console.error("Transaction Failed:", error);
        displayAlert("Transaction failed. Please try again.");
        setIsLoading(false);
      }
    } else {
      console.error("Please install MetaMask!");
      displayAlert("Please install MetaMask!");
      setIsLoading(false);
    }
  }

  
  const sendEtherThroughBackend = async () => {

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/sendEther', {
        recipient,
        amount,
      });
      console.log('Transaction success:', response.data);
      setTransactionInfo(response.data);
      displayAlert("Transaction successful!");
      setIsLoading(false);
    } catch (error:any) {
      console.error('Transaction failed:', error.response);
      displayAlert("All fields must be filled or Transaction failed. Please try again.");
      setIsLoading(false);
    }
  };


  const shortenTxHash = (txHash:any) => {
    if (txHash.length > 10) {
      return `${txHash.slice(0, 5)}...${txHash.slice(-5)}`;
    }
    return txHash;
  }


  return (
    <div className="relative">
    {/* Loading Overlay */}
    {isLoading && (
         <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
           <div className="shine">
            <FontAwesomeIcon icon={faBitcoin} className="text-6xl text-yellow-400 spin-pulse border-2 border-yellow-300 rounded-full p-1 special" />
          </div>
        </div>
    )}
    {showAlert && (
          <div className="fixed top-0 left-0 w-full bg-red-500 text-white py-4 px-4 flex items-center z-50 border-2 border-yellow-400" style={{minHeight: 'fit-content'}}>
          <div className="flex-grow text-center text-2xl">{alertMessage}</div>
          <button onClick={() => setShowAlert(false)} className="text-6xl">×</button>
        </div>
      )}
      <div className="flex flex-col justify-center min-h-screen gradient-background py-20">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md mx-auto">
            {!walletConnected ? (
              <div className="text-center py-6 bg-gray-500 rounded-xl">
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg shadow-lg transform transition-all duration-150 hover:from-blue-700 hover:to-purple-800 hover:scale-105 active:scale-95"
              >
                Connect Your Wallet
              </button>
            </div>
            
            ) : (
              <>
                <div className="text-center py-2 mb-4 bg-green-100 rounded">
                  Your wallet is connected
                  <button onClick={disconnectWallet} className="block w-full mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-700 transition duration-150 ease-in-out">
                    Disconnect Wallet
                  </button>
                </div>
                <h1 className="text-2xl font-semibold mb-4 text-center">Send Ether</h1>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Recipient Address"
                    className="input w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    className="input w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={sendEtherThroughBackend} className="w-full px-4 py-2 bg-gray-500 text-white font-bold rounded hover:bg-gray-700 transition duration-150 ease-in-out">
                    Send Ether Server 
                  </button>
                  <button onClick={sendEther} className="w-full px-4 py-2 orange text-white font-bold rounded transition duration-150 ease-in-out">
                    Send Ether via MetaMask
                  </button>
                </div>
                <div className="mt-6">
                  {logs.map((log, index) => (
                    <>
                    <h2 className="text-xl font-semibold mb-2 text-center">Transaction Logs:</h2>
                    <p key={index} className="text-gray-600 break-words">{JSON.stringify(log)}</p> // Displaying logs
                    </>
                  ))}
                </div>
      
                {transactionInfo && (
                  <div className="mt-4 p-4 bg-gray-200 rounded-lg text-center">
                    <h2 className="text-xl font-semibold mb-2 text-center titleSpecial">TRANSACTION LOGS:</h2>
                    <div>
                    <p><span className="font-bold">To address: </span> {shortenTxHash(transactionInfo.recipient)}</p>
                    <p><span className="font-bold">Total: </span> {transactionInfo.amount} ETH</p>
                    <p><span className="font-bold">Tax(gas): </span> {transactionInfo.gasUsed} units</p>
                    <p><span className="font-bold">Cost(gas): </span> {transactionInfo.gasCost} ETH</p> {/* Displaying the gas cost */}
                    <p><span className="font-bold">Hash: </span> {shortenTxHash(transactionInfo.txHash)}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
}

export default SendEther;




