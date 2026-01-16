import React from 'react'

import StatsGrid from '../../../components/Sales/StatsGrid';
import TableSection from '../../../components/Sales/TableSection';

function SalesPage() {
  return (
    <div className = "space-y-6">
      <StatsGrid />
      <TableSection />
    </div>
  )
}

export default SalesPage;