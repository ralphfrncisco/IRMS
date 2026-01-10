import React from 'react';

import RecentOrdersTable from './RecentOrdersTable';
import ActivityFeed from './ActivityFeed';

function TableSection() {

  return (
    <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrdersTable/>
        </div>
        <div>
          <ActivityFeed/>
        </div>
      </div>
  );
}

export default TableSection;