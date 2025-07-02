'use client'

import React from 'react';
import withAuth from '../hoc/withAuth';

function Dashboard() {
  return (
    <div>Dashboard</div>
  );
}

// Wrap the Dashboard component with withAuth before exporting
export default withAuth(Dashboard);