import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const ForbiddenResult = () => {
    const navigate = useNavigate()
    return (
        <Result
            status="403"
            title="Login richiesto"
            subTitle="Le tue credenziali sono scadute. Per favore effettua nuovamente il login."
            extra={<Button type="primary" onClick={() => {navigate("/login")}}>Login</Button>}
        />
    )
}

export default ForbiddenResult