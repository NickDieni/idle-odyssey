'use client';

import DashboardResources from '@/components/DashboardResources';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <DashboardResources />
    </div>
  );
}
