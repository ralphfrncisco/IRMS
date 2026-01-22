import React from 'react'
import StatsGrid from "../../../components/Balances/StatsGrid";
import TableSection from "../../../components/Balances/TableSection";

function Balances() {
  return (
    <div className = "space-y-6">
      <StatsGrid />
      <TableSection />
    </div>
  )
}

export default Balances;