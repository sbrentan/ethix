import React, { useContext} from "react";
import { TransactionContext } from ".//../context/TransactionContext.js";
import logo from "../metamask.png";


const MetamaskButton = () => {
  const {
    wallet,
    connectWallet
  } = useContext(TransactionContext);
  
	return  <button type="button" onClick={connectWallet}
    style={{
      border: "solid 2px #444",
      fontFamily: "sans-serif",
      fontSize: "15px",
      padding: "15px 20px 15px 70px",
      background: "#000",
      borderRadius: "5px",
      backgroundImage: `url(${logo})`,
      backgroundSize: "40px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "20px",
      fontWeight: "bold",
      color: "#fff",
      cursor: "pointer",
      transition: "all 0.4s ease",
    }}
  >Connect wallet</button>
};

export default MetamaskButton;
