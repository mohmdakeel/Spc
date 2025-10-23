// app/profile/page.tsx
'use client';
import { useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { Save } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const toggleSidebar = () => setIsOpenSidebar(!isOpenSidebar);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Full Name:</strong> {user.fullName}</p>
            <p><strong>Department:</strong> {user.department}</p>
            <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
            <p><strong>Permissions:</strong> {user.permissions.join(', ')}</p>
            {user.imageUrl && <img src={user.imageUrl} alt="Profile" className="w-32 h-32 object-cover mt-4" />}
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            {success && <p className="text-green-500 mb-2">{success}</p>}
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <button onClick={handleChangePassword} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <Save className="w-4 h-4 mr-2" /> Save Password
            </button>
          </div>
          <button onClick={toggleSidebar} className="md:hidden fixed top-4 left-4 p-2 bg-gray-200 rounded">Menu</button>
        </main>
      </div>
    </div>
  );
}