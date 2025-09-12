import http from './http';

export type AvailabilityVehicle = {
  id: number;
  vehicleNumber: string;
  status: string;
  busyCount: number;
};
export type AvailabilityDriver = {
  id: number | string;
  name: string;
  status: string;
  busyCount: number;
};

export async function fetchAvailability(from: Date, to: Date) {
  const { data } = await http.get(`/availability`, {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return data as {
    window: { from: string; to: string };
    vehicles: AvailabilityVehicle[];
    drivers: AvailabilityDriver[];
    activeTrips: Array<{
      id: number;
      vehicleNumber?: string;
      driverName?: string;
      pickupAt: string;
      expectedReturnAt: string;
    }>;
  };
}
