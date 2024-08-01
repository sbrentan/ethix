import { useSelector } from 'react-redux'
import { useMemo } from "react"
import { selectCurrentToken } from "../features/auth/authSlice"
import { ROLES } from "../config/roles"
import jwtDecode from 'jwt-decode'

const useAuth = () => {
    const token = useSelector(selectCurrentToken)
    const authState = useMemo(() => {
        let isUser = false
        let isDonor = false
        let isBeneficiary = false
        let isAdmin = false

        if (!token) {
            return { username: '', roles: null, isUser, isDonor, isBeneficiary, isAdmin, verified: null }
        }
        const decoded = jwtDecode(token)
        const { username, role, verified } = decoded.UserInfo

        isUser = (role === ROLES.User)
        isDonor = (role === ROLES.Donor)
        isBeneficiary = (role === ROLES.Beneficiary)
        isAdmin = (role === ROLES.Admin)

        const status = getStatus(role)
        

        return { username, role, status, isUser, isDonor, isBeneficiary, isAdmin, verified }
    }, [token])

    return authState
}
export default useAuth

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
