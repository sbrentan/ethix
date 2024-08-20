import React from 'react'
import useAuth from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

const HomeDispatcher = () => {
    const { isUser, isDonor, isBeneficiary, isAdmin } = useAuth()

    let path = ""
    if (isUser) {
        path='/user'
    } else if (isDonor) {
        path='/donor'
    }else if (isBeneficiary) {
        path='/beneficiary'
    } else if (isAdmin) {
        path='/admin'
    } else {
        path='/'
    }

  return (
    <Navigate to={path} replace />
  )
}

export default HomeDispatcher