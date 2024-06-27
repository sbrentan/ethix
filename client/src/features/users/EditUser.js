import { useParams } from "react-router-dom"
import EditUserForm from "./EditUserForm"
import { useGetUsersQuery } from "./usersApiSlice"
import { useDispatch } from "react-redux"

// Component to edit user, it will wait to receive the data before passing down to the form component, which
// will handle all the operations.
const EditUser = () => {
    const { id } = useParams()

    const { user, isLoading } = useGetUsersQuery("usersList", {
        selectFromResult: ({ data }) => ({
            user: data?.entities[id]
        }),
    })

    const dispatch = useDispatch()

    // ensuring we have the user data before we need it in the EditUserForm
    if (!user) return <p color={"#FFF"}>Loading...</p>
    
    const content = <EditUserForm user={user} />

    return content
}

export default EditUser