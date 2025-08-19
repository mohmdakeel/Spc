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
import { User, Printer, History, Edit, Trash2, Plus, Eye, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

const ITEMS_PER_PAGE = 15;
const LICENSE_EXPIRY_WARNING_DAYS = 30;

const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : "-";

const isLicenseExpiringSoon = (expiryDate?: string) => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= LICENSE_EXPIRY_WARNING_DAYS;
};

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'suspended': return 'bg-red-100 text-red-800';
    case 'inactive': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const loadDrivers = async () => setDrivers(await fetchDrivers());
  const loadDeletedDrivers = async () => setDeletedDrivers(await fetchDeletedDrivers());

  useEffect(() => {
    loadDrivers();
    loadDeletedDrivers();
  }, []);

  const filteredDrivers = (showDeleted ? deletedDrivers : drivers).filter(d =>
    Object.values(d)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedDrivers = filteredDrivers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrintDriver = (driver: Driver) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Driver Details - ${driver.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
              .detail-row { margin-bottom: 10px; }
              .label { font-weight: bold; color: #6b7280; min-width: 150px; display: inline-block; }
              .warning { color: #dc2626; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Driver Details</h1>
            <div class="detail-row"><span class="label">ID:</span> ${driver.employeeId}</div>
            <div class="detail-row"><span class="label">Name:</span> ${driver.name}</div>
            <div class="detail-row"><span class="label">Phone:</span> ${driver.phone || '-'}</div>
            <div class="detail-row"><span class="label">Email:</span> ${driver.email || '-'}</div>
            <div class="detail-row"><span class="label">License:</span> ${driver.licenseNumber}</div>
            <div class="detail-row">
              <span class="label">License Expiry:</span> 
              ${formatDate(driver.licenseExpiryDate)}
              ${isLicenseExpiringSoon(driver.licenseExpiryDate) ? '<span class="warning"> (Expiring Soon)</span>' : ''}
            </div>
            <div class="detail-row"><span class="label">Experience:</span> ${driver.drivingExperience || '-'}</div>
            <div class="detail-row"><span class="label">Status:</span> ${driver.status || '-'}</div>
            <div class="detail-row"><span class="label">Printed On:</span> ${new Date().toLocaleString()}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 200);
    }
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '', 'width=900,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${showDeleted ? 'Deleted Drivers' : 'Active Drivers'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              h1 { color: #ea580c; text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #ffedd5; color: #9a3412; text-align: left; padding: 8px; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              .warning { background-color: #fff3cd; }
              .status-active { background-color: #dcfce7; color: #166534; }
              .status-suspended { background-color: #fee2e2; color: #991b1b; }
              .status-inactive { background-color: #fef9c3; color: #854d0e; }
              .print-info { margin-bottom: 15px; font-size: 14px; }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>
            <h1>${showDeleted ? 'Deleted Drivers Report' : 'Active Drivers Report'}</h1>
            <div class="print-info">Printed on: ${new Date().toLocaleString()}</div>
            <div class="print-info">Total records: ${filteredDrivers.length}</div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>License</th>
                  <th>Expiry</th>
                  <th>Experience</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredDrivers.map((driver, index) => `
                  <tr class="${isLicenseExpiringSoon(driver.licenseExpiryDate) ? 'warning' : ''}">
                    <td>${driver.employeeId}</td>
                    <td>${driver.name}</td>
                    <td>${driver.phone || '-'}</td>
                    <td>${driver.email || '-'}</td>
                    <td>${driver.licenseNumber}</td>
                    <td>
                      ${formatDate(driver.licenseExpiryDate)}
                      ${isLicenseExpiringSoon(driver.licenseExpiryDate) ? '<span style="color:red"> (Expiring Soon)</span>' : ''}
                    </td>
                    <td>${driver.drivingExperience || '-'}</td>
                    <td class="status-${driver.status?.toLowerCase() || ''}">${driver.status || '-'}</td>
                  </tr>
                  ${(index + 1) % ITEMS_PER_PAGE === 0 && index !== filteredDrivers.length - 1 ? '<tr class="page-break"></tr>' : ''}
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 200);
    }
  };

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
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteDriver(deleteTarget.employeeId);
      setDeleteTarget(null);
      loadDrivers();
      loadDeletedDrivers();
      setCurrentPage(1);
    }
  };

  return (
    <div className="flex h-screen bg-orange-50">
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <User className="text-orange-600 mr-3" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Management</h1>
                <p className="text-sm text-orange-600">{filteredDrivers.length} {showDeleted ? 'deleted' : 'active'} drivers</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex rounded-lg overflow-hidden border border-orange-300 shadow-sm">
                <button
                  className={`px-4 py-2 flex items-center gap-2 ${!showDeleted ? "bg-orange-600 text-white" : "bg-white text-orange-600 hover:bg-orange-50"}`}
                  onClick={() => {
                    setShowDeleted(false);
                    setCurrentPage(1);
                  }}
                >
                  <span>Active</span>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    {drivers.length}
                  </span>
                </button>
                <button
                  className={`px-4 py-2 flex items-center gap-2 ${showDeleted ? "bg-red-600 text-white" : "bg-white text-red-600 hover:bg-red-50"}`}
                  onClick={() => {
                    setShowDeleted(true);
                    setCurrentPage(1);
                  }}
                >
                  <span>Deleted</span>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {deletedDrivers.length}
                  </span>
                </button>
              </div>
              <button
                className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
                onClick={handleAdd}
              >
                <Plus size={18} />
                <span>Add Driver</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                onClick={handlePrintAll}
              >
                <Printer size={18} />
                <span>Print All</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-orange-100">
            <table className="w-full">
              <thead className="bg-orange-50">
                <tr>
                  <th className="p-3 text-left font-medium text-orange-800">ID</th>
                  <th className="p-3 text-left font-medium text-orange-800">Driver</th>
                  <th className="p-3 text-left font-medium text-orange-800">Contact</th>
                  <th className="p-3 text-left font-medium text-orange-800">License</th>
                  <th className="p-3 text-left font-medium text-orange-800">Status</th>
                  <th className="p-3 text-left font-medium text-orange-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {displayedDrivers.map((driver) => (
                  <tr
                    key={driver.employeeId}
                    className={`hover:bg-orange-50 cursor-pointer transition-colors ${isLicenseExpiringSoon(driver.licenseExpiryDate) ? "bg-yellow-50" : ""}`}
                    onClick={() => handleRowClick(driver)}
                  >
                    <td className="p-3 font-mono text-sm text-gray-600">{driver.employeeId}</td>
                    <td className="p-3">
                      <div className="font-medium">{driver.name}</div>
                      <div className="text-sm text-gray-500">{driver.drivingExperience || 'No'} experience</div>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-800">{driver.phone || '-'}</div>
                      <div className="text-sm text-gray-500">{driver.email || '-'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{driver.licenseNumber}</div>
                      <div className={`text-sm ${isLicenseExpiringSoon(driver.licenseExpiryDate) ? "text-red-600 font-semibold flex items-center gap-1" : "text-gray-500"}`}>
                        {formatDate(driver.licenseExpiryDate)}
                        {isLicenseExpiringSoon(driver.licenseExpiryDate) && (
                          <AlertTriangle size={14} />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {driver.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintDriver(driver);
                          }}
                          title="Print"
                        >
                          <Printer size={18} />
                        </button>
                        {!showDeleted && (
                          <>
                            <button
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
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
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(driver);
                              }}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg mb-2">No {showDeleted ? 'deleted' : 'active'} drivers found</div>
                <button
                  onClick={handleAdd}
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  Add a new driver
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredDrivers.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center p-4 border-t border-orange-100">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentPage === 1 ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white hover:bg-orange-700"}`}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  </span>
                  <span className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredDrivers.length)}</span> of <span className="font-medium">{filteredDrivers.length}</span>
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentPage === totalPages ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white hover:bg-orange-700"}`}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
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