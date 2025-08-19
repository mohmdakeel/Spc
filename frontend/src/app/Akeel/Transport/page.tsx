// src/app/akeel/transport/page.tsx
import VehiclePage from './page';

export default function TransportDashboard() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Transport Management Dashboard</h1>
      <VehiclePage />
    </div>
  );
}