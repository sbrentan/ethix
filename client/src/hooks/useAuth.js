import { useSelector } from 'react-redux'
import { selectCurrentToken } from "../features/auth/authSlice"
import { ROLES } from "../config/roles"
import jwtDecode from 'jwt-decode'

const useAuth = () => {
    const token = useSelector(selectCurrentToken)
    let isUser = false
    let isDonor = false
    let isBeneficiary = false
    let isAdmin = false
    let status = null

    if (token) {
        const decoded = jwtDecode(token)
        const { username, role, verified } = decoded.UserInfo

        isUser = (role === ROLES.User)
        isDonor = (role === ROLES.Donor)
        isBeneficiary = (role === ROLES.Beneficiary)
        isAdmin = (role === ROLES.Admin)

        if (isUser) status = "User"
        if (isDonor) status = "Donor"
        if (isBeneficiary) status = "Beneficiary"
        if (isAdmin) status = "Admin"

        return { username, role, status, isUser, isDonor, isBeneficiary, isAdmin, verified }
    }

    return { username: '', roles: null, status, isUser, isDonor, isBeneficiary, isAdmin, verified: null }
}
export default useAuth