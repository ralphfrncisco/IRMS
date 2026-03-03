import React from 'react';

import RecentOrdersTable from './RecentOrdersTable';
import RecentRestock from './RecentRestock';

function TableSection() {

  return (
    <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrdersTable/>
        </div>
        <div>
          <RecentRestock/>
        </div>
      </div>
  );
}

export default TableSection;