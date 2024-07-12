import React, { useState, useContext } from "react";
import { TransactionContext } from "../context/TransactionContext";

const Input = ({ placeholder, name, type, value, handleChange }) => (
  <input
    placeholder={placeholder}
    type={type}
    step={name === 'amount' ? '0.001' : '1'}
    value={value}
    min={name === 'amount' ? '0.001' : '1'}
    onChange={(e) => handleChange(e, name)}
    className="my-2 w-full rounded-sm p-2 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"
  />
);

const Test = () => {
    const { 
      connectWallet, 
      isLoggedIn,
      currentAccount,
      verifyOrganization, 
      isOrganizationVerified, 
      revokeOrganization, 
      handleChange,
      formData,
      startCampaign, 
      campaigns, 
      getCampaign,
      getCampaignTokens,
      endCampaign,
      reedemToken
    } = useContext(TransactionContext);

    const [campaignId, setCampaignId] = useState(null);
    const [tokenId, setTokenId] = useState(null);
  
    return (
      <>
        {!isLoggedIn && (
          <button type="button" onClick={connectWallet}>Connect wallet</button>
        )}
        <p>Connected wallet: {currentAccount}</p>

        <br /><hr /><br />

        <p>Campaigns: {Array.from(campaigns).join(', ')}</p>

        <Input placeholder="Title" name="title" type="text" handleChange={handleChange} />
        <Input placeholder="Description" name="description" type="text" handleChange={handleChange} />
        <Input placeholder="Image" name="image" type="text" handleChange={handleChange} />
        <Input placeholder="Deadline" name="deadline" type="date" handleChange={handleChange} />
        <Input placeholder="Amount (ETH)" name="amount" type="number" handleChange={handleChange} />
        <Input placeholder="Amount (tokens)" name="tokens" type="number" handleChange={handleChange} />
        <select placeholder="Beneficiary (address)" name="beneficiary" onChange={(e) => handleChange(e, e.target.name)}>
          <option value="addr1">First beneficiary</option>
          <option value="addr2">Second beneficiary</option>
        </select>

        <br /> <br />

        <p>{JSON.stringify(formData)}</p>

        <button type="button" onClick={startCampaign}>Start Campaign</button>

        <br /><hr /><br />

        <input placeholder="Campaign ID" type="text" onChange={(e) => setCampaignId(e.target.value)} />

        <p>Current campaign: {campaignId}</p>

        <button type="button" onClick={() => getCampaign(campaignId)}>Get campaign</button>

        <button type="button" onClick={() => getCampaignTokens(campaignId)}>Get campaign tokens</button>

        <button type="button" onClick={() => endCampaign(campaignId)}>End campaign</button>

        <br /><hr /><br />
        
        <input placeholder="Token ID" type="text" onChange={(e) => setTokenId(e.target.value)} />
        <p>Current token: {tokenId}</p>

        <button type="button" onClick={() => reedemToken(campaignId, tokenId)}>Reedem</button>

        <br /><hr /><br />

        <button type="button" onClick={() => verifyOrganization(currentAccount)}>Verify Organization</button>

        <button type="button" onClick={() => isOrganizationVerified(currentAccount)}>Is verified?</button>

        <button type="button" onClick={() => revokeOrganization(currentAccount)}>Revoke verification</button>
      </>        
    );
  };
  
  export default Test;