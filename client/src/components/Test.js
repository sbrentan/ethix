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
      handleCreateCampaign,
      startCampaign, 
      campaign, 
      getCampaignsIds,
      getCampaign,
      getCampaignTokens,
      claimRefund,
      claimDonation,
      handleTokenRedeem,
      getBalance,
      getCampaignBalance
    } = useContext(TransactionContext);

    const [campaignIdBc, setCampaignIdBc] = useState(null);
    const [campaignIdDb, setCampaignIdDb] = useState(null);
    const [tokenId, setTokenId] = useState(null);
    const [address, setAddress] = useState(null);
  
    return (
      <>
        {!isLoggedIn && (
          <button type="button" onClick={connectWallet}>Connect wallet</button>
        )}
        <p>Connected wallet: {currentAccount}</p>

        <br /><hr /><br />

        <p>Campaign: {campaign}</p>

        <Input placeholder="Title" name="title" type="text" handleChange={handleChange} />
        <Input placeholder="Description" name="description" type="text" handleChange={handleChange} />
        <Input placeholder="Deadline" name="deadline" type="date" handleChange={handleChange} />
        <Input placeholder="Amount (ETH)" name="amount" type="number" handleChange={handleChange} />
        <Input placeholder="Amount (tokens)" name="tokens" type="number" handleChange={handleChange} />
        <select placeholder="Beneficiary (address)" name="beneficiary" onChange={(e) => handleChange(e, e.target.name)}>
          <option value="0xc05B7bC6Bde92F8e6820fD47c7e23DFE01869886">First beneficiary</option>
          <option value="0x8588f4d002C747C5E7B6274752B251402c77d858">Second beneficiary</option>
        </select>

        <br /> <br />

        <p>{JSON.stringify(formData)}</p>

        <button type="button" onClick={handleCreateCampaign}>Create Campaign</button>
        <button type="button" onClick={startCampaign}>Start Campaign</button>

        <br /><hr /><br />

        <input placeholder="CampaignIdDb (DB)" type="text" onChange={(e) => setCampaignIdDb(e.target.value)} />
        <input placeholder="Campaign ID (BlockChain)" type="text" onChange={(e) => setCampaignIdBc(e.target.value)} />

        <p>Current campaign (DB): {campaignIdDb}</p>
        <p>Current campaign (Blockchain): {campaignIdBc}</p>

        <br /><hr /><br />

        <button type="button" onClick={getCampaignsIds}>Get campaigns Ids</button>

        <button type="button" onClick={() => getCampaign(campaignIdBc)}>Get campaign</button>

        <button type="button" onClick={() => getCampaignTokens(campaignIdBc)}>Get campaign tokens</button>

        <button type="button" onClick={() => claimRefund(campaignIdBc)}>Claim refund</button>

        <button type="button" onClick={() => claimDonation(campaignIdBc)}>Claim donation</button>

        <button type="button" onClick={() => getCampaignBalance(campaignIdBc)}>Get campaign balance</button>

        <br /><hr /><br />
        
        <input placeholder="Token ID" type="text" onChange={(e) => setTokenId(e.target.value)} />
        <p>Current token: {tokenId}</p>

        <button type="button" onClick={() => handleTokenRedeem(campaignIdBc, tokenId)}>Reedem</button>

        <br /><hr /><br />

        <input placeholder="Address" type="text" onChange={(e) => setAddress(e.target.value)} />
        <p>Current organization: {address}</p>

        <button type="button" onClick={() => verifyOrganization(address)}>Verify Organization</button>

        <button type="button" onClick={() => isOrganizationVerified(address)}>Is verified?</button>

        <button type="button" onClick={() => revokeOrganization(address)}>Revoke verification</button>

        <br /><hr /><br />

        <button type="button" onClick={getBalance}>Get Charity balance</button>
      </>        
    );
  };
  
  export default Test;