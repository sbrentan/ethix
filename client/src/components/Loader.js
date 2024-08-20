import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import React from 'react'

const Loader = () => {
  return (
    <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'white' }} spin />} fullscreen />
  )
}

export default Loader