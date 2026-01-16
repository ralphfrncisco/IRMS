import React from 'react'

import StatsGrid from "../components/Suppliers/StatsGrid";
import TableSection from '../components/Suppliers/TableSection';   

function Suppliers() {
  return (
    <div className = "space-y-6">
      <StatsGrid />
      <TableSection />
    </div>
  )
}

export default Suppliers;