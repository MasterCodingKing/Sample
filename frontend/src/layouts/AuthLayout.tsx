import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0xMHY2aC02di02aDZ6bTEwIDB2Nmg2di02aC02em0tMjAgMHY2aC02di02aDZ6bTEwLTEwdjZoLTZ2LTZoNnptLTEwIDB2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-12 h-12 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Barangay Management System</h1>
          <p className="text-primary-200 mt-1">Malvar, Batangas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-primary-200 text-sm mt-6">
          © {new Date().getFullYear()} Barangay Management System. All rights reserved.
        </p>
      </div>
    </div>
  )
}
