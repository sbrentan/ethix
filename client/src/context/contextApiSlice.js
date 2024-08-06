import { apiSlice } from "../app/api/apiSlice";

export const api = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getCampaign: builder.mutation({
            query: params => `/campaigns/${params?.campaignId}`
        }),
        createCampaign: builder.mutation({
            query: params => ({
                url: '/campaigns',
                method: 'POST',
                body: { ...params }
            })
        }),
        associateCampaigns: builder.mutation({
            query: params => ({
                url: `/campaigns/${params?.campaignId}/associate`,
                method: 'POST',
                body: {
                    campaignId: params?.campaignAddress,
                    tokenDonation: params?.tokenPrice,
                    tokens: params?.tokens
                }
            })
        }),
        redeemToken: builder.mutation({
            query: params => ({
                url: '/tokens/redeem',
                method: 'POST',
                body: { 
                    campaignId: params?.campaignId, 
                    campaignAddress: params?.campaignAddress, 
                    tokenId: params?.tokenId 
                }
            })
        })
    })
});

export const {
    useGetCampaignMutation,
    useCreateCampaignMutation,
    useAssociateCampaignsMutation,
    useRedeemTokenMutation
} = api;