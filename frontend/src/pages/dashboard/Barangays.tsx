import { useState, useEffect, useCallback } from 'react'
import { barangayService } from '../../services/dashboardService'
import type { Barangay } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  HomeModernIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

export default function Barangays() {
  const { user: currentUser } = useAuthStore()
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBarangay, setEditingBarangay] = useState<Barangay | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    municipality: '',
    province: '',
    contact_number: '',
    email: '',
    captain_name: '',
  })

  // Only super_admin can access this page
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const fetchBarangays = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await barangayService.getAll()
      setBarangays(data)
    } catch (error) {
      console.error('Failed to fetch barangays:', error)
      toast.error('Failed to load barangays')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBarangays()
  }, [fetchBarangays])

  const handleCreate = () => {
    setEditingBarangay(null)
    setFormData({
      name: '',
      address: '',
      municipality: '',
      province: '',
      contact_number: '',
      email: '',
      captain_name: '',
    })
    setShowModal(true)
  }

  const handleEdit = (barangay: Barangay) => {
    setEditingBarangay(barangay)
    setFormData({
      name: barangay.name || '',
      address: barangay.address || '',
      municipality: barangay.municipality || '',
      province: barangay.province || '',
      contact_number: barangay.contact_number || '',
      email: barangay.email || '',
      captain_name: barangay.captain_name || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Barangay name is required')
      return
    }

    try {
      if (editingBarangay) {
        await barangayService.update(editingBarangay.id, formData)
        toast.success('Barangay updated successfully')
      } else {
        await barangayService.create(formData)
        toast.success('Barangay created successfully')
      }
      setShowModal(false)
      fetchBarangays()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save barangay')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this barangay? This action cannot be undone.')) return

    try {
      await barangayService.delete(id)
      toast.success('Barangay deleted successfully')
      fetchBarangays()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to delete barangay')
    }
  }

  const filteredBarangays = barangays.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.municipality?.toLowerCase().includes(search.toLowerCase()) ||
      b.province?.toLowerCase().includes(search.toLowerCase())
  )

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <BuildingOffice2Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">Only Super Admin can manage barangays.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Barangays</h1>
          <p className="text-gray-500 mt-1">Manage all barangays in the system</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Barangay
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search barangays..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Barangays Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredBarangays.length === 0 ? (
        <div className="card text-center py-12">
          <BuildingOffice2Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No barangays found</h3>
          <p className="text-gray-500 mt-2">Get started by creating a new barangay.</p>
          <button onClick={handleCreate} className="btn btn-primary mt-4 inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Barangay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarangays.map((barangay) => (
            <div key={barangay.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    {barangay.logo_url ? (
                      <img src={barangay.logo_url} alt={barangay.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <BuildingOffice2Icon className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{barangay.name}</h3>
                    <p className="text-sm text-gray-500">
                      {barangay.municipality}{barangay.province ? `, ${barangay.province}` : ''}
                    </p>
                  </div>
                </div>
                {barangay.is_active ? (
                  <span className="badge badge-green flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="badge badge-red flex items-center gap-1">
                    <XCircleIcon className="w-3 h-3" />
                    Inactive
                  </span>
                )}
              </div>

              {barangay.captain_name && (
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Captain:</span> {barangay.captain_name}
                </p>
              )}

              {barangay.address && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{barangay.address}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  <span>Residents</span>
                </div>
                <div className="flex items-center gap-1">
                  <HomeModernIcon className="w-4 h-4" />
                  <span>Households</span>
                </div>
                <div className="flex items-center gap-1">
                  <BuildingStorefrontIcon className="w-4 h-4" />
                  <span>Businesses</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(barangay)}
                  className="btn btn-outline flex-1 inline-flex items-center justify-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(barangay.id)}
                  className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50 inline-flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBarangay ? 'Edit Barangay' : 'Add New Barangay'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barangay Name *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter barangay name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipality
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.municipality}
                    onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                    placeholder="Municipality"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Province"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="barangay@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barangay Captain
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.captain_name}
                  onChange={(e) => setFormData({ ...formData, captain_name: e.target.value })}
                  placeholder="Captain's full name"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBarangay ? 'Update Barangay' : 'Create Barangay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
