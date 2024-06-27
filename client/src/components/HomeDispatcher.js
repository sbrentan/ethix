import React from 'react'
import useAuth from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

const HomeDispatcher = () => {
    const { isUser, isCompany, isAssociation, isAdmin } = useAuth()

    let path = ""
    if (isUser) {
        path='/user'
    } else if (isCompany) {
        path='/company'
    }else if (isAssociation) {
        path='/association'
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