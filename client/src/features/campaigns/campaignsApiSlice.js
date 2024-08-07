import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const campaignsAdapter = createEntityAdapter({})
const beneficiariesAdapter = createEntityAdapter({})

const initialState = campaignsAdapter.getInitialState()

export const campaignsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        createCampaign: builder.mutation({
            query: createCampaign => ({
                url: '/campaigns',
                method: 'POST',
                body: { ...createCampaign }
            })
        }),
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
        getDonorCampaigns:builder.query({
            query: () => ({
                url: '/campaigns/userCampaigns',
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
        getBeneficiaries:builder.query({
            query: () => ({
                url: '/users/beneficiaries',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            })
        }),
    }),
})
export const {
    useGetCampaignsQuery,
    useGetDonorCampaignsQuery,
    useCreateCampaignMutation,
    useGetBeneficiariesQuery
} = campaignsApiSlice