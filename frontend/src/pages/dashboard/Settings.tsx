import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { barangayService } from '../../services/dashboardService'
import toast from 'react-hot-toast'
import {
  BuildingOffice2Icon,
  GlobeAltIcon,
  CogIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

export default function Settings() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'general' | 'barangay' | 'documents' | 'system'>(
    'general'
  )
  const [isLoading, setIsLoading] = useState(false)

  const [barangaySettings, setBarangaySettings] = useState({
    name: user?.barangay?.name || '',
    address: user?.barangay?.address || '',
    contact_number: user?.barangay?.contact_number || '',
    email: user?.barangay?.email || '',
    captain_name: '',
    website: '',
  })

  const [documentSettings, setDocumentSettings] = useState({
    barangay_clearance_fee: 50,
    barangay_certificate_fee: 50,
    indigency_fee: 0,
    residency_fee: 50,
    business_clearance_fee: 100,
    validity_days: 180,
  })

  const handleBarangaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.barangay_id) return

    setIsLoading(true)
    try {
      await barangayService.update(user.barangay_id, barangaySettings)
      toast.success('Barangay settings updated')
    } catch {
      toast.error('Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // This would typically save to a settings API
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Document settings updated')
    } catch {
      toast.error('Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { key: 'general', label: 'General', icon: CogIcon },
    { key: 'barangay', label: 'Barangay', icon: BuildingOffice2Icon },
    { key: 'documents', label: 'Documents', icon: DocumentTextIcon },
    { key: 'system', label: 'System', icon: GlobeAltIcon },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="Barangay Management System"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select className="input">
                    <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select className="input">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="btn btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Barangay Tab */}
          {activeTab === 'barangay' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Barangay Information</h2>
              <form onSubmit={handleBarangaySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barangay Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={barangaySettings.name}
                      onChange={(e) =>
                        setBarangaySettings({ ...barangaySettings, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Captain Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={barangaySettings.captain_name}
                      onChange={(e) =>
                        setBarangaySettings({ ...barangaySettings, captain_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={barangaySettings.address}
                      onChange={(e) =>
                        setBarangaySettings({ ...barangaySettings, address: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      className="input"
                      value={barangaySettings.contact_number}
                      onChange={(e) =>
                        setBarangaySettings({ ...barangaySettings, contact_number: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="input"
                      value={barangaySettings.email}
                      onChange={(e) =>
                        setBarangaySettings({ ...barangaySettings, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://"
                      value={barangaySettings.website}
                      onChange={(e) =>
                        setBarangaySettings({ ...barangaySettings, website: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button type="submit" disabled={isLoading} className="btn btn-primary">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Document Settings</h2>
              <form onSubmit={handleDocumentSubmit} className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Document Fees (₱)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Barangay Clearance
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={documentSettings.barangay_clearance_fee}
                        onChange={(e) =>
                          setDocumentSettings({
                            ...documentSettings,
                            barangay_clearance_fee: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Barangay Certificate
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={documentSettings.barangay_certificate_fee}
                        onChange={(e) =>
                          setDocumentSettings({
                            ...documentSettings,
                            barangay_certificate_fee: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Certificate of Indigency
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={documentSettings.indigency_fee}
                        onChange={(e) =>
                          setDocumentSettings({
                            ...documentSettings,
                            indigency_fee: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Certificate of Residency
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={documentSettings.residency_fee}
                        onChange={(e) =>
                          setDocumentSettings({
                            ...documentSettings,
                            residency_fee: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Business Clearance
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={documentSettings.business_clearance_fee}
                        onChange={(e) =>
                          setDocumentSettings({
                            ...documentSettings,
                            business_clearance_fee: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Validity (days)
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={documentSettings.validity_days}
                        onChange={(e) =>
                          setDocumentSettings({
                            ...documentSettings,
                            validity_days: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button type="submit" disabled={isLoading} className="btn btn-primary">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">System Information</h2>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Environment</span>
                  <span className="font-medium text-gray-900">Production</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Database</span>
                  <span className="font-medium text-green-600">Connected</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">API Status</span>
                  <span className="font-medium text-green-600">Online</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-600">Last Backup</span>
                  <span className="font-medium text-gray-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Maintenance</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="btn btn-outline">Clear Cache</button>
                  <button className="btn btn-outline">Backup Database</button>
                  <button className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50">
                    Reset System
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
