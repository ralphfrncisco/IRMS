import React from 'react';
import RevenueChart from './RevenueChart';
import SalesChart from './SalesChart';

function ChartSection() {
  return (
    <div className = "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      <div className = "lg:col-span-2">
        <RevenueChart />
      </div>
      <div className = "lg:col-span-1">
        <SalesChart />
      </div>
    </div>
  )
}

export default ChartSection;