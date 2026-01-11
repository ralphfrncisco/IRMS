import React from 'react'

import SalesStatsGrid from './SalesStatsGrid';
import SalesTable from './SalesTable';

function SalesPage() {
  return (
    <div className = "space-y-6">
      <SalesStatsGrid />
      <SalesTable />
    </div>
  )
}

export default SalesPage;