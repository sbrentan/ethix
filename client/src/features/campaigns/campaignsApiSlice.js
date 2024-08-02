import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const campaignsAdapter = createEntityAdapter({})

const initialState = campaignsAdapter.getInitialState()

export const campaignsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getCampaigns: builder.query({
            query: () => ({
                url: '/campaigns',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformResponse: responseData => {
                const loadedCampaigns = responseData.map(campaign => {
                    campaign.id = campaign._id
                    return campaign
                });
                return campaignsAdapter.setAll(initialState, loadedCampaigns)
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'Campaign', id: 'LIST' },
                        ...result.ids.map(id => ({ type: 'Campaign', id }))
                    ]
                } else return [{ type: 'Campaign', id: 'LIST' }]
            }
        }),
    }),
})

export const {
    useGetCampaignsQuery,
} = campaignsApiSlice