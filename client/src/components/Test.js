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
      formData, 
      handleChange,
      createCampaign,
      startCampaign, 
      getCampaign,
      getCampaignsIds,
      getCampaignTokens,
      claimRefund,
      claimDonation,
      handleTokenRedeem
    } = useContext(TransactionContext);

    const [campaignsIds, setCampaignsIds] = useState([]);
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

        <Input placeholder="Title" name="title" type="text" handleChange={handleChange} />
        <Input placeholder="Start date" name="startdate" type="date" handleChange={handleChange} />
        <Input placeholder="Deadline" name="deadline" type="date" handleChange={handleChange} />
        <Input placeholder="Amount (ETH)" name="amount" type="number" handleChange={handleChange} />
        <Input placeholder="Amount (tokens)" name="tokens" type="number" handleChange={handleChange} />
        <select placeholder="Beneficiary (address)" name="beneficiary" defaultValue={'DEFAULT'} onChange={(e) => handleChange(e, e.target.name)}>
          <option value="DEFAULT" disabled>Choose beneficiary</option>
          <option value="0x665d33620B72b917932Ae8bdE0382494C25b45e1">First beneficiary</option>
        </select>

        <br /> <br />

        <p>{JSON.stringify(formData)}</p>

        <button type="button" onClick={createCampaign}>Create Campaign</button>
        <button type="button" id="start" onClick={startCampaign}>Start Campaign</button>

        <br /><hr /><br />

        <input placeholder="CampaignIdDb (DB)" type="text" onChange={(e) => setCampaignIdDb(e.target.value)} />
        <input placeholder="Campaign ID (BlockChain)" type="text" onChange={(e) => setCampaignIdBc(e.target.value)} />

        <p>Current campaign (DB): {campaignIdDb}</p>
        <p>Current campaign (Blockchain): {campaignIdBc}</p>

        <br /><hr /><br />

        <p>Campaings Ids: {campaignsIds.map((id) => (<li key={id}>{id}</li>))}</p>

        <button type="button" onClick={async () => {
          const ids = await getCampaignsIds();
          setCampaignsIds(ids);
        }}>Get campaigns Ids</button>

        <button type="button" onClick={() => getCampaign(campaignIdBc)}>Get campaign</button>

        <button type="button" onClick={() => getCampaignTokens(campaignIdBc)}>Get campaign tokens</button>

        <button type="button" onClick={() => claimRefund(campaignIdBc)}>Claim refund</button>

        <button type="button" onClick={() => claimDonation(campaignIdBc)}>Claim donation</button>

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
      </>        
    );
  };
  
  export default Test;