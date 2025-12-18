'use client';

import { useState } from 'react';
import Modal from '../../../components/Modal';
import { CheckCircle, XCircle, Copy } from 'lucide-react';
import api from '../../../lib/api';
import { User as UserType } from '../../../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserType | null;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  targetUser,
}: ResetPasswordModalProps) {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDoReset = async () => {
    if (!targetUser?.id) {
      setErrorMsg('No user selected.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setGeneratedPassword('');

    try {
      setLoading(true);
      const { data } = await api.post(`/users/${targetUser.id}/reset-password`);
      if (data?.newPassword) {
        setGeneratedPassword(data.newPassword);
        setSuccessMsg('Password reset successfully.');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setSuccessMsg('Password copied to clipboard.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
      onSubmit={handleDoReset}
      submitText={loading ? 'Processing...' : 'Reset Password'}
      size="md"
      loading={loading}
    >
      {!targetUser ? (
        <div className="text-gray-600 text-sm">No user selected.</div>
      ) : (
        <div className="space-y-4">
          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="text-green-800">{successMsg}</div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div className="text-red-800">{errorMsg}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <p className="text-gray-900">{targetUser.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EPF No</label>
              <p className="text-gray-900">{targetUser.epfNo || 'N/A'}</p>
            </div>
          </div>

          {generatedPassword && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <p className="text-sm text-green-800 font-semibold">
                New Temporary Password
              </p>
              <div className="flex items-center justify-between">
                <p className="text-green-900 font-mono break-all text-sm">
                  {generatedPassword}
                </p>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Share this password with the employee. They should change it after logging in.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
