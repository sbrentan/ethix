import { useSelector } from 'react-redux'
import { selectCurrentToken } from "../features/auth/authSlice"
import { ROLES } from "../config/roles"
import jwtDecode from 'jwt-decode'

const useAuth = () => {
    const token = useSelector(selectCurrentToken)
    let isUser = false
    let isCompany = false
    let isAssociation = false
    let isAdmin = false
    let status = "Employee"

    if (token) {
        const decoded = jwtDecode(token)
        const { username, role } = decoded.UserInfo

        isUser = (role === ROLES.User)
        isCompany = (role === ROLES.Company)
        isAssociation = (role === ROLES.Association)
        isAdmin = (role === ROLES.Admin)

        if (isUser) status = "User"
        if (isCompany) status = "Company"
        if (isAssociation) status = "Association"
        if (isAdmin) status = "Admin"

        return { username, role, status, isUser, isCompany, isAssociation, isAdmin }
    }

    return { username: '', roles: null, isUser, isCompany, isAssociation, isAdmin }
}
export default useAuth