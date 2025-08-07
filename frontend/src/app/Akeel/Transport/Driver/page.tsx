"use client";
import React, { useEffect, useState } from "react";
import {
  fetchDrivers,
  fetchDeletedDrivers,
  fetchDriverWithPreviousData,
  deleteDriver,
  Driver,
  addDriver,
  updateDriver,
} from "../services/driverService";
import DriverModal from "./DriverModal";
import DeletedDriverModal from "./DeletedDriverModal";
import PreviousDataModal from "./PreviousDataModal";
import DriverForm from "./DriverForm";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import SearchBar from "../components/SearchBar";
import { useRouter } from "next/navigation";
import { User, Printer, History, Edit, Trash2, Plus, Eye } from "lucide-react";

const DriverListPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deletedDrivers, setDeletedDrivers] = useState<Driver[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [modalType, setModalType] = useState<"active" | "deleted" | "print" | "form" | null>(null);
  const [search, setSearch] = useState("");
  const [showPrevModal, setShowPrevModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const router = useRouter();

  // Load drivers
  const loadDrivers = async () => setDrivers(await fetchDrivers());
  const loadDeletedDrivers = async () => setDeletedDrivers(await fetchDeletedDrivers());

  useEffect(() => {
    loadDrivers();
    loadDeletedDrivers();
  }, []);

  // Filter by search
  const displayedDrivers = (showDeleted ? deletedDrivers : drivers).filter((d) =>
    Object.values(d)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Open modal with driver + previousData loaded
  const handleRowClick = async (driver: Driver) => {
    if (!showDeleted) {
      const { driver: fullDriver, previousData } = await fetchDriverWithPreviousData(driver.employeeId);
      setSelected({ ...fullDriver, previousData });
      setModalType("active");
    } else {
      setSelected(driver);
      setModalType("deleted");
    }
  };

  // Handle print (can reuse DriverModal and trigger window.print)
  const handlePrint = async (driver: Driver) => {
    const { driver: fullDriver, previousData } = await fetchDriverWithPreviousData(driver.employeeId);
    setSelected({ ...fullDriver, previousData });
    setModalType("print");
  };

  // Add/Edit logic
  const handleAdd = () => {
    setFormMode("add");
    setSelected(null);
    setModalType("form");
  };
  const handleEdit = async (driver: Driver) => {
    const { driver: fullDriver } = await fetchDriverWithPreviousData(driver.employeeId);
    setSelected(fullDriver);
    setFormMode("edit");
    setModalType("form");
  };
  const handleSubmit = async (driver: Driver) => {
    if (formMode === "add") {
      await addDriver(driver);
    } else if (formMode === "edit" && driver.employeeId) {
      await updateDriver(driver.employeeId, driver);
    }
    setModalType(null);
    loadDrivers();
    loadDeletedDrivers();
  };

  // Delete logic
  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteDriver(deleteTarget.employeeId);
      setDeleteTarget(null);
      loadDrivers();
      loadDeletedDrivers();
    }
  };

  // Format license expiry
  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString() : "-";

  return (
    <div className="flex h-screen bg-orange-50">
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <User className="text-orange-600 mr-2" size={24} />
              <h1 className="text-2xl font-bold text-gray-800">Driver Management</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex rounded-lg overflow-hidden border border-orange-300">
                <button
                  className={`px-4 py-2 ${!showDeleted ? "bg-orange-600 text-white" : "bg-white text-orange-600"}`}
                  onClick={() => setShowDeleted(false)}
                >
                  Active Drivers
                </button>
                <button
                  className={`px-4 py-2 ${showDeleted ? "bg-orange-600 text-white" : "bg-white text-orange-600"}`}
                  onClick={() => setShowDeleted(true)}
                >
                  Deleted Drivers
                </button>
              </div>
              <button
                className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                onClick={handleAdd}
              >
                <Plus size={18} />
                <span>Add Driver</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-orange-100 text-orange-800">
                  <th className="p-3 text-left font-semibold">ID</th>
                  <th className="p-3 text-left font-semibold">Name</th>
                  <th className="p-3 text-left font-semibold">Phone</th>
                  <th className="p-3 text-left font-semibold">Email</th>
                  <th className="p-3 text-left font-semibold">License</th>
                  <th className="p-3 text-left font-semibold">Expiry</th>
                  <th className="p-3 text-left font-semibold">Experience</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedDrivers.map((driver) => (
                  <tr
                    key={driver.employeeId}
                    className="border-b hover:bg-orange-50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(driver)}
                  >
                    <td className="p-3">{driver.employeeId}</td>
                    <td className="p-3 font-medium">{driver.name}</td>
                    <td className="p-3">{driver.phone ?? "-"}</td>
                    <td className="p-3">{driver.email ?? "-"}</td>
                    <td className="p-3">{driver.licenseNumber}</td>
                    <td className="p-3">{formatDate(driver.licenseExpiryDate)}</td>
                    <td className="p-3">{driver.drivingExperience ?? "-"}</td>
                    <td className="p-3">{driver.status ?? "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(driver);
                          }}
                          title="Print"
                        >
                          <Printer size={18} />
                        </button>
                        {!showDeleted && (
                          <>
                            <button
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/Akeel/Transport/History?entityType=Driver&entityId=${driver.employeeId}`
                                );
                              }}
                              title="History"
                            >
                              <History size={18} />
                            </button>
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(driver);
                              }}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(driver);
                              }}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        {showDeleted && (
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(driver);
                              setModalType("deleted");
                            }}
                            title="View Deleted Data"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {displayedDrivers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No {showDeleted ? "deleted" : "active"} drivers found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalType === "active" && selected && (
        <DriverModal
          driver={selected}
          onClose={() => setModalType(null)}
          onShowPrev={() => setShowPrevModal(true)}
        />
      )}
      {modalType === "deleted" && selected && (
        <DeletedDriverModal driver={selected} onClose={() => setModalType(null)} />
      )}
      {modalType === "print" && selected && (
        <DriverModal
          driver={selected}
          onClose={() => setModalType(null)}
          triggerPrint={true}
        />
      )}
      {modalType === "form" && (
        <DriverForm
          driver={selected}
          onSubmit={handleSubmit}
          onClose={() => setModalType(null)}
        />
      )}
      {showPrevModal && selected?.previousData && (
        <PreviousDataModal
          prevData={selected.previousData}
          onClose={() => setShowPrevModal(false)}
          title="Previous Version"
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          driver={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default DriverListPage;
