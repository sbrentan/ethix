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
    wallet,
    connectWallet,
    organization,
    setOrganization,
    verifyOrganization,
    isOrganizationVerified,
    revokeOrganization,
    formData,
    handleChange,
    campaign,
    setCampaign,
    createCampaign,
    startCampaign,
    getCampaign,
    getCampaignsIds,
    getCampaignTokens,
    claimRefund,
    claimDonation,
    redeemToken
  } = useContext(TransactionContext);

  const [campaignsIds, setCampaignsIds] = useState([]);
  const [tokenId, setTokenId] = useState(null);

  return (
    <>
      {!wallet.is_logged && (
        <button type="button" onClick={connectWallet}>Connect wallet</button>
      )}
      <p>Connected wallet: {wallet.address}</p>

      {wallet.is_logged && (
        <div>
          <br /><hr /><br />

          <Input value={formData.title} placeholder="Title" name="title" type="text" handleChange={handleChange} />
          <Input placeholder="Start date" name="startdate" type="datetime-local" handleChange={handleChange} />
          <Input placeholder="Deadline" name="deadline" type="datetime-local" handleChange={handleChange} />
          <Input value={formData.target} placeholder="Target (ETH)" name="target" type="number" handleChange={handleChange} />
          <Input value={formData.tokens} placeholder="Amount (tokens)" name="tokens" type="number" handleChange={handleChange} />
          <select placeholder="Beneficiary (address)" name="beneficiary" defaultValue={formData.beneficiary} onChange={(e) => handleChange(e, e.target.name)}>
            <option value="DEFAULT" disabled>Choose beneficiary</option>
            <option value="0x665d33620B72b917932Ae8bdE0382494C25b45e1">First beneficiary</option>
          </select>

          <br /> <br />

          <p>{JSON.stringify(formData)}</p>

          <button type="button" onClick={() => createCampaign('66a7a899d8d441aa09810736', '66841d794229eb671102d6b1')}>Create Campaign</button>
          <button type="button" id="start" onClick={startCampaign} disabled={!campaign?.is_fundable}>Start Campaign</button>

          <p>Current camapign id: {campaign?.id}</p>
          <p>Current camapign address: {campaign?.address}</p>

          <br /><hr /><br />

          <input placeholder="Campaign ID" type="text" onChange={(e) => setCampaign((prevState) => ({ ...prevState, id: e.target.value }))} />
          <input placeholder="Campaign Address" type="text" onChange={(e) => setCampaign((prevState) => ({ ...prevState, address: e.target.value }))} />

          <p>Current campaign (DB): {campaign?.id}</p>
          <p>Current campaign (Blockchain): {campaign?.address}</p>

          <br /><hr /><br />

          <p>Campaings Ids: {campaignsIds.map((id) => (<li key={id}>{id}</li>))}</p>

          <button type="button" onClick={async () => {
            const ids = await getCampaignsIds();
            setCampaignsIds(ids);
          }}>Get campaigns Ids</button>

          <button type="button" onClick={async () => await getCampaign(campaign.address)}>Get campaign</button>

          <button type="button" onClick={() => getCampaignTokens(campaign.address)}>Get campaign tokens</button>

          <button type="button" onClick={() => claimRefund(campaign.address)}>Claim refund</button>

          <button type="button" onClick={() => claimDonation(campaign.address)}>Claim donation</button>

          <br /><hr /><br />

          <input placeholder="Token ID" type="text" onChange={(e) => setTokenId(e.target.value)} />
          <p>Current token: {tokenId}</p>

          <button type="button" onClick={() => redeemToken(campaign.id, campaign.address, tokenId)}>Reedem</button>

          <br /><hr /><br />

          <input placeholder="Address" type="text" onChange={(e) => setOrganization((prevState) => ({ ...prevState, address: e.target.value }))} />
          <p>Current organization: {organization.address}</p>

          <button type="button" onClick={() => verifyOrganization(organization.address)}>Verify Organization</button>

          <button type="button" onClick={() => isOrganizationVerified(organization.address)}>Is verified?</button>

          <button type="button" onClick={() => revokeOrganization(organization.address)}>Revoke verification</button>
        </div>
      )}
    </>
  );
};

export default Test;