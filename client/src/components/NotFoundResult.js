import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const NotFoundResult = () => {
    const navigate = useNavigate()
    return (
        <Result
            status="404"
            title="Pagina non Trovata"
            subTitle="Scusa, la pagina che hai visitato non esiste."
            extra={<Button type="primary" onClick={() => {navigate("/")}}>Ritorna alla Home</Button>}
        />
    )
}

export default NotFoundResult