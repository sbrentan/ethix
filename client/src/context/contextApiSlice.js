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
        generateRandomWallet: builder.mutation({
            query: params => `/campaigns/${params?.campaignId}/wallet/random`
        }),
        generateCampaignTokens: builder.mutation({
            query: params => ({
                url: `/campaigns/${params?.campaignId}/tokens`,
                method: 'POST'
            })
        }),
        redeemToken: builder.mutation({
            query: params => ({
                url: '/tokens/redeem',
                method: 'POST',
                body: { ...params }
            })
        })
    })
});

export const {
    useGetCampaignMutation,
    useCreateCampaignMutation,
    useGenerateRandomWalletMutation,
    useGenerateCampaignTokensMutation,
    useRedeemTokenMutation
} = api;