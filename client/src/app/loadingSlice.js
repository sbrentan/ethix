import { createSlice } from "@reduxjs/toolkit";

const loadingSlice = createSlice({
    name: 'loading',
    initialState:{
        loading: false,
    },
    reducers: {
        showLoading:(state, action)=>{
            state.loading = true;
            console.log(state.loading)
        },
        hideLoading: (state, action) => {
            state.loading = false;
        },
    },
})

export const {showLoading, hideLoading} = loadingSlice.actions;
export default loadingSlice.reducer;

export const selectLoadingState = (state) => state.loading.loading