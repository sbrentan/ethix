import { apiSlice } from "../../app/api/apiSlice";
import { logOut, setCredentials } from "./authSlice";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation({
            query: credentials => ({
                url: '/auth',
                method: 'POST',
                body: { ...credentials }
            })
        }),
        register: builder.mutation({
            query: newCredentials => ({
                url: '/auth/register',
                method: 'POST',
                body: { ...newCredentials }
            })
        }),
        registerDonorBeneficiary: builder.mutation({
            query: newCredentials => ({
                url: '/auth/register/thirdParts',
                method: 'POST',
                body: { ...newCredentials }
            })
        }),
        sendLogout: builder.mutation({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    dispatch(logOut())
                    setTimeout(() => {
                        dispatch(apiSlice.util.resetApiState())
                    }, 1000)
                } catch (err) {
                    console.log(err?.error?.data?.message)
                }
            }
        }),
        refresh: builder.mutation({
            query: () => ({
                url: '/auth/refresh',
                method: 'GET',
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    const { accessToken } = data
                    dispatch(setCredentials({ accessToken }))
                } catch (err) {
                    console.log(err?.error?.data?.message)
                }
            }
        }),
    })
})

export const {
    useLoginMutation,
    useRegisterMutation,
    useSendLogoutMutation,
    useRefreshMutation,
    useRegisterDonorBeneficiaryMutation,
} = authApiSlice