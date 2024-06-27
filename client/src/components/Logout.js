import React, { useEffect } from "react";
import { useSendLogoutMutation } from "../features/auth/authApiSlice";
import { useNavigate } from "react-router";

const Logout = () => {
	const [sendLogout, { isLoading, isSuccess, isError, error }] =
		useSendLogoutMutation();
	const navigate = useNavigate();
	useEffect(() => {
		sendLogout();
	}, []);
    useEffect(() => {
		if (isSuccess) navigate("/");
	}, [isSuccess, navigate]);
	return <div>Caricamento...</div>;
};

export default Logout;
