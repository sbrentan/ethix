import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const NotFoundResult = ({ subTitle = "The page you are looking for cannot be found"}) => {
    const navigate = useNavigate()
    return (
        <Result
            status="404"
            title="Page not found"
            subTitle={subTitle}
            extra={<Button type="primary" onClick={() => {navigate("/")}}>Return to Home</Button>}
        />
    )
}

export default NotFoundResult