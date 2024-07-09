import React, { useContext } from "react";
import { TransactionContext } from "../context/TransactionContext";

const Test = () => {
    const { connectWallet, currentAccount } = useContext(TransactionContext);
  
    return (
        <>
            {!currentAccount && (
              <button type="button" onClick={connectWallet}>Connect wallet</button>
            )}
            <p>Connected wallet: {currentAccount}</p>
        </>        
    );
  };
  
  export default Test;