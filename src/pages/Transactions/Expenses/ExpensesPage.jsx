import React from 'react'
import StatsGrid from "../../../components/Expenses/StatsGrid";
import TableSection from "../../../components/Expenses/TableSection";

function Expenses() {
  return (
    <div className = "space-y-6">
      <StatsGrid />
      <TableSection />
    </div>
  )
}

export default Expenses;