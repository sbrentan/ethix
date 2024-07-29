import { apiSlice } from "../app/api/apiSlice";

export const api = apiSlice.injectEndpoints({
    endpoints: builder => ({
        createCampaign: builder.mutation({
            query: formData => ({
                url: '/campaigns',
                method: 'POST',
                body: { ...formData }
            })
        }),
        associateCampaigns: builder.mutation({
            query: formData => ({
                url: `/campaigns/${formData?.campaignIdDb}/associate`,
                method: 'POST',
                body: { 
                    campaignId: formData?.campaignIdBc, 
                    tokenDonation: formData?.tokenPrice, 
                    tokens: formData?.tokenAmount
                }
            })
        }),
        redeemToken: builder.mutation({
            query: formData => ({
                url: '/tokens/redeem',
                method: 'POST',
                body: { campaignId: formData?.campaignId, tokenId: formData?.tokenId }
            })
        })
    })
});

export const { 
    useCreateCampaignMutation,
    useAssociateCampaignsMutation,
    useRedeemTokenMutation 
} = api;