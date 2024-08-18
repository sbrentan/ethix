import React, { useEffect } from "react";
import { useSendLogoutMutation } from "../features/auth/authApiSlice";
import { useNavigate } from "react-router";
import Cookies from 'universal-cookie';
const cookies = new Cookies();

const Logout = () => {
	const [sendLogout, { isLoading, isSuccess, isError, error }] =
		useSendLogoutMutation();
	const navigate = useNavigate();
	useEffect(() => {
		sendLogout();
		cookies.remove('jwt_cookie');
	}, []);
    useEffect(() => {
		if (isSuccess) navigate("/");
	}, [isSuccess, navigate]);
	return <div>Caricamento...</div>;
};

export default Logout;
