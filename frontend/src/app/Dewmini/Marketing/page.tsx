'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Registration {
  email: string;
  id: number;
  epfNo: string;
  attendanceNo: string;
  nameWithInitials: string;
  surname: string;
  fullName: string;
  nicNo: string;
  dateOfBirth: string;
  civilStatus: string;
  gender: string;
  race: string;
  religion: string;
  bloodGroup: string;
  permanentAddress: string;
  district: string;
  mobileNo: string;
  personalEmail: string;
  cardStatus: string;
  imageUrl?: string | null;
  currentAddress: string;
  dsDivision: string;
  residencePhone: string;
  emergencyContact: string;
  workingStatus: string;
  deleted: boolean;
  version: number;
}

interface User {
  id: number;
  epfNo: string;
  username: string;
  email: string;
  fullName: string;
  department?: string;
  designation?: string;
  contactNo?: string;
  company?: string;
  copyFromPrivileges?: string;
  remarks?: string;
  active: boolean;
  role: string;
  registration: Registration;
}

export default function UsersTranscriptPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/users')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching backend:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleExpanded = (userId: number) => {
    setExpandedRow(expandedRow === userId ? null : userId);
  };

  const handleDelete = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      // TODO: fetch(`http://localhost:8080/api/users/${userId}`, { method: 'DELETE' })
    }
  };

  const handleAdd = () => {
    router.push('/Dewmini/Marketing/transcript/register'); // ✅ absolute path
  };

  const handleModify = (registrationId: number) => {
  router.push(`/Dewmini/Marketing/registrations/${registrationId}/edit`);
};

  if (loading) return <p className="text-center mt-10 text-gray-800">Loading users...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Backend Users Transcript</h1>

        {/* Add User Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
          >
            Add User
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg">No users found from backend.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Username</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">EPF No</th>
                    <th className="px-4 py-3 text-left font-semibold">Full Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-left font-semibold">Active</th>
                    <th className="px-4 py-3 text-left font-semibold">Department</th>
                    <th className="px-4 py-3 text-left font-semibold">Designation</th>
                    <th className="px-4 py-3 text-left font-semibold">Company</th>
                    <th className="px-4 py-3 text-left font-semibold">Contact</th>
                    <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                    <th className="px-4 py-3 text-center font-semibold">Registration</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user, index) => (
                    <React.Fragment key={user.id}>
                      {/* Main row */}
                      <tr
                        className={`${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-200`}
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">{user.id}</td>
                        <td className="px-4 py-3 text-gray-800">{user.username}</td>
                        <td className="px-4 py-3 text-gray-800">{user.email}</td>
                        <td className="px-4 py-3 text-gray-800">{user.epfNo}</td>
                        <td className="px-4 py-3 text-gray-800">{user.fullName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'USER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800">{user.department || '-'}</td>
                        <td className="px-4 py-3 text-gray-800">{user.designation || '-'}</td>
                        <td className="px-4 py-3 text-gray-800">{user.company || '-'}</td>
                        <td className="px-4 py-3 text-gray-800">{user.contactNo || '-'}</td>
                        <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={user.remarks || '-'}>
                          {user.remarks || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleExpanded(user.id)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                              expandedRow === user.id
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                            }`}
                          >
                            {expandedRow === user.id ? 'Hide ▲' : 'Show ▼'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
  onClick={() => handleModify(user.registration.id)}   // ⬅️ use registration.id
  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
>
  Edit
</button>

                            <button
                              onClick={() => handleDelete(user.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expandedRow === user.id && (
                        <tr key={`expanded-${user.id}`}>
                          <td colSpan={14} className="px-0 py-0">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400">
                              <div className="p-6">
                                <h4 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm mr-2">
                                    Registration Details
                                  </span>
                                </h4>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Full Name:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.fullName}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">NIC No:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.nicNo}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Date of Birth:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.dateOfBirth}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Gender:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.gender}</span>
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Mobile No:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.mobileNo}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Personal Email:</span>
                                        <span className="text-gray-600 ml-1">
                                          {user.registration.personalEmail || user.registration.email}
                                        </span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Blood Group:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.bloodGroup}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Working Status:</span>
                                        <span
                                          className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                                            user.registration.workingStatus === 'Active'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {user.registration.workingStatus}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Current Address:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.currentAddress}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">District:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.district}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Emergency Contact:</span>
                                        <span className="text-gray-600 ml-1">{user.registration.emergencyContact}</span>
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-700">Card Status:</span>
                                        <span
                                          className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                                            user.registration.cardStatus === 'Active'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}
                                        >
                                          {user.registration.cardStatus}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
