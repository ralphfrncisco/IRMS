import React from 'react';

import StatsGrid from '../../components/Dashboard/StatsGrid';
import ChartSection from '../../components/Dashboard/ChartSection';
import TableSection from '../../components/Dashboard/TableSection';

function Dashboard() {
  
  return (
    <div>
      {/* <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Welcome back to your admin panel.
      </p> */}

        <StatsGrid />
        
        <ChartSection />
        
        <TableSection />
    </div>
  );
}

export default Dashboard;