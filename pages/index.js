import Head from "next/head";
import { useState, useEffect } from "react";
import Web3 from "web3";
import nftabi from "../abi/NFT.json";
import markabi from "../abi/Marketplace.json";
import axios from "axios";

export default function Home() {
  const PINATA_API_KEY = "62363ded77486cda92ed";
  const PINATA_API_SECRET =
    "5d7dc87f93e2798eaa4fa1d8261508e1607edca44ff5831254bd98c9e53a0faa";

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [web3, setweb3] = useState(null);
  const [nft, setNFT] = useState({});
  const [marketplace, setMarketplace] = useState({});
  const [but, setbut] = useState("Connect Wallet");
  const [price, setPrice] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [butn, setbutn] = useState(false);
  const [li, setListedItems] = useState([]);

  // MetaMask Login/Connect

  async function connectToMetaMask() {
    setLoading(true);
    if (typeof window.ethereum !== "undefined") {
      try {
        const lib = new Web3(window.ethereum);

        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await lib.eth.getAccounts();
        const networkId = await lib.eth.net.getId();

        setAccount(accounts[0]);
        setbut(accounts[0]);
        setweb3(lib);

        if (networkId != 11155111) {
          alert("Please switch to Sepolia testnet to use");
          return;
        }

        const marketplace1 = new lib.eth.Contract(
          markabi.abi,
          "0x0837164A5f199877c087bC37CB7DaaA342a39823"
        );
        setMarketplace(marketplace1);

        const nft1 = new lib.eth.Contract(
          nftabi.abi,
          "0xa6361A7D944F1Be73f2B6B68410E3298088eee9C"
        );

        setNFT(nft1);

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }
  }

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
      }
    );

    const imageUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    return imageUrl;
  };

  const handleFileUpload = async (event) => {
    setbutn(true);
    const file = event.target.files[0];
    const imageUrl = await uploadImage(file);
    setImageUrl(imageUrl);
    setbutn(false);
  };

  const mintlist = async () => {
    if (!price || !imageUrl) return;
    const uri = imageUrl;
    setLoading(true);

    await nft.methods.mint(uri).send({ from: account });
    // get tokenId of new nft
    setLoading(false);
    const id = await nft.methods.tokenCount().call();

    // approve marketplace to spend nft
    setLoading(true);
    await nft.methods
      .setApprovalForAll(marketplace._address, true)
      .send({ from: account });
    setLoading(false);
    //write
    const listingPrice = web3.utils.toWei(price.toString(), "ether");
    setLoading(true);
    await marketplace.methods
      .makeItem(nft._address, id, listingPrice)
      .send({ from: account });
    setLoading(false);
  };

  const loadListedItems = async () => {
    // Load all sold items that the user listed
    setLoading(true);
    const itemCount = await marketplace.methods.itemCount().call();
    let listedItems = [];

    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.methods.items(indx).call();

      // get uri url from nft contract
      let uri2 = await nft.methods.tokenURI(i.tokenId).call();
      // use uri to fetch the nft metadata stored on ipfs
      const response2 = await fetch(uri2);
      const totalPrice = await marketplace.methods
        .getTotalPrice(i.itemId)
        .call();
      // define listed item object
      let item = {
        totalPrice,
        price: i.price,
        itemId: i.itemId,
        image: uri2,
      };
      listedItems.push(item);
    }
    setLoading(false);
    setListedItems(listedItems);
  };

  return (
    <>
      <Head>
        <title>NFT Marketplace</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {loading ? (
        <h1>loading</h1>
      ) : (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 min-h-screen min-w-full flex flex-col justify-center items-center gap-4">
          <h1 className="text-white font-bold text-2xl">
            NFT MARKETPLACE (SEPOLIA)
          </h1>
          <button
            onClick={connectToMetaMask}
            className="bg-blue-500  text-white mt-4 font-semibold py-2 px-4 rounded-full hover:bg-indigo-500 hover:text-black transition-colors duration-300 ease-in-out mb-3"
          >
            {but}
          </button>
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="file"
              >
                Upload File
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                accept="image/*"
                type="file"
                onChange={handleFileUpload}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Name
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="NFT Name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="desc"
              >
                Description
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="desc"
                type="text"
                placeholder="Describe NFT"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="eth"
              >
                Cost in Eth
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="eth"
                type="number"
                placeholder="Cost of NFT in Eth"
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className=" mt-8 flex items-center justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline "
                type="button"
                onClick={mintlist}
                disabled={butn}
              >
                Mint & List NFT
              </button>
            </div>
          </form>
          <h1 className="text-white font-medium text-2xl">Listed NFTs</h1>
          <button
            onClick={loadListedItems}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline "
          >
            Load NFTs
          </button>
          <div className="flex flex-row align-middle gap-3 justify-around">
            {li.map((item, idx) => (
              <ul key={idx}>
                <li>
                  <img src={item.image} />
                  <h5 className="text-center">
                    {web3.utils.fromWei(item.totalPrice, "ether")} ETH
                  </h5>
                </li>
              </ul>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
