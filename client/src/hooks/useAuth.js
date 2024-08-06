import { useSelector } from 'react-redux'
import { useMemo } from "react"
import { selectCurrentToken } from "../features/auth/authSlice"
import { ROLES } from "../config/roles"
import jwtDecode from 'jwt-decode'

const getStatus = (role) => {
    switch(role) {
        case ROLES.User:
            return "User"
        case ROLES.Donor:
            return "Donor"
        case ROLES.Beneficiary:
            return "Beneficiary"
        case ROLES.Admin:
            return "Admin"
        default:
            return "User"
    }
}

const useAuth = () => {
    const token = useSelector(selectCurrentToken)
    const authState = useMemo(() => {
        let isUser = false
        let isDonor = false
        let isBeneficiary = false
        let isAdmin = false

        if (!token) {
            return { username: '', role: null,status:null, isUser, isDonor, isBeneficiary, isAdmin, verified: null }
        }
        const decoded = jwtDecode(token)
        console.log(decoded.UserInfo);
        const { userId,username, role, verified } = decoded.UserInfo

        console.log("role:"+role)
        isUser = (role === ROLES.User)
        isDonor = (role === ROLES.Donor)
        isBeneficiary = (role === ROLES.Beneficiary)
        isAdmin = (role === ROLES.Admin)

        const status = getStatus(role)
        

        return { userId, username, role, status, isUser, isDonor, isBeneficiary, isAdmin, verified }
    }, [token])

    return authState
}
export default useAuth
