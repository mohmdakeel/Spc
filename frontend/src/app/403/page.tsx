// app/403/page.tsx
export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">403 – Forbidden</h1>
        <p className="text-gray-600">You don’t have permission to view this page.</p>
      </div>
    </div>
  );
}
