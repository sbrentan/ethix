import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const profileRequestsAdapter = createEntityAdapter({})

const initialState = profileRequestsAdapter.getInitialState()

export const profileRequestsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getProfileRequests: builder.query({
            query: () => ({
                url: '/requests/profiles',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformResponse: responseData => {
                const loadedProfileRequests = responseData.map(profileRequest => {
                    profileRequest.id = profileRequest._id
                    return profileRequest
                });
                return profileRequestsAdapter.setAll(initialState, loadedProfileRequests)
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'ProfileRequest', id: 'LIST' },
                        ...result.ids.map(id => ({ type: 'ProfileRequest', id }))
                    ]
                } else return [{ type: 'ProfileRequest', id: 'LIST' }]
            }
        }),
        updateProfileRequest: builder.mutation({
            query: initialProfileRequestData => ({
                url: '/requests/profiles',
                method: 'PATCH',
                body: {
                    ...initialProfileRequestData,
                }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'ProfileRequest', id: arg.id }
            ]
        }),
        deleteProfileRequest: builder.mutation({
            query: ({ id }) => ({
                url: `/requests/profiles`,
                method: 'DELETE',
                body: { id }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'ProfileRequest', id: arg.id }
            ]
        }),
        getMyProfileRequests: builder.query({
            query: () => ({
                url: '/requests/myprofile',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
        }),
        createMyNewRequest: builder.mutation({
            query: newCredentials => ({
                url: '/requests/myprofile',
                method: 'POST',
                body: { ...newCredentials }
            })
        }),
    }),
})

export const {
    useGetProfileRequestsQuery,
    useUpdateProfileRequestMutation,
    useDeleteProfileRequestMutation,
    useGetMyProfileRequestsQuery,
    useCreateMyNewRequestMutation,
} = profileRequestsApiSlice