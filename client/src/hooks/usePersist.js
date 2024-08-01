import { useState, useEffect } from "react"

const KEY = "persist"
const usePersist = () => {
    const [persist, setPersist] = useState(false)

    useEffect(() => {
        setPersist(JSON.parse(localStorage.getItem(KEY)))
    }, [])

    const setter = (toPersist) => {
        setPersist(toPersist)
        localStorage.setItem(KEY, JSON.stringify(toPersist))
    }

    return [persist, setter]
}

export default usePersist
