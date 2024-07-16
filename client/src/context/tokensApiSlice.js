import { apiSlice } from "../app/api/apiSlice";

export const api = apiSlice.injectEndpoints({
    endpoints: builder => ({
        redeemToken: builder.mutation({
            query: ({ campaignId, tokenId }) => ({
                url: '/tokens/redeem',
                method: 'POST',
                body: { campaignId, tokenId }
            })
        })
    })
});

export const { useRedeemTokenMutation } = api;