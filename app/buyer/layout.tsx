export const dynamic = 'force-dynamic';

import BuyerLayoutWrapper from './layout-wrapper'
import React from 'react'

const BuyerPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <BuyerLayoutWrapper>
      {children}
    </BuyerLayoutWrapper>
  )
}

export default BuyerPageLayout