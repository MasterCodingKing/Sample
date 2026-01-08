import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { businessService } from '../../services/businessService'
import { residentService } from '../../services/residentService'
import type { Business, Resident } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type BusinessFormData = Omit<Business, 'id' | 'barangay_id' | 'created_at' | 'updated_at' | 'owner'>

export default function BusinessForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)
  const [residents, setResidents] = useState<Resident[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessFormData>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch residents for owner dropdown
        const residentResponse = await residentService.getAll({ limit: 1000 })
        setResidents(residentResponse.data || residentResponse.residents || [])

        if (id) {
          const business = await businessService.getById(Number(id))
          reset({
            business_name: business.business_name,
            trade_name: business.trade_name || '',
            business_type: business.business_type,
            business_nature: business.business_nature || '',
            business_category: business.business_category,
            owner_id: business.owner_id,
            dti_registration: business.dti_registration || '',
            sec_registration: business.sec_registration || '',
            bir_tin: business.bir_tin || '',
            address: business.address,
            purok: business.purok || '',
            contact_number: business.contact_number || '',
            email: business.email || '',
            floor_area: business.floor_area,
            capital: business.capital,
            gross_sales: business.gross_sales,
            employees_count: business.employees_count,
            date_established: business.date_established?.split('T')[0] || '',
            status: business.status,
            notes: business.notes || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data')
      } finally {
        setIsFetching(false)
      }
    }
    fetchData()
  }, [id, reset])

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true)
    try {
      if (isEdit) {
        await businessService.update(Number(id), data)
        toast.success('Business updated successfully')
      } else {
        await businessService.create(data)
        toast.success('Business registered successfully')
      }
      navigate('/businesses')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save business')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/businesses"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Businesses
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Business' : 'Register New Business'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update business information' : 'Register a new business in the barangay'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                className={`input ${errors.business_name ? 'border-red-500' : ''}`}
                placeholder="Enter business name"
                {...register('business_name', { required: 'Business name is required' })}
              />
              {errors.business_name && (
                <p className="mt-1 text-sm text-red-500">{errors.business_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade Name</label>
              <input
                type="text"
                className="input"
                placeholder="Trade name (if different)"
                {...register('trade_name')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type *
              </label>
              <select
                className={`input ${errors.business_type ? 'border-red-500' : ''}`}
                {...register('business_type', { required: 'Business type is required' })}
              >
                <option value="">Select type</option>
                <option value="sole_proprietorship">Sole Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="corporation">Corporation</option>
                <option value="cooperative">Cooperative</option>
              </select>
              {errors.business_type && (
                <p className="mt-1 text-sm text-red-500">{errors.business_type.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Category *
              </label>
              <select
                className={`input ${errors.business_category ? 'border-red-500' : ''}`}
                {...register('business_category', { required: 'Business category is required' })}
              >
                <option value="">Select category</option>
                <option value="micro">Micro</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              {errors.business_category && (
                <p className="mt-1 text-sm text-red-500">{errors.business_category.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nature of Business
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Retail, Manufacturing, Services"
                {...register('business_nature')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" {...register('status')}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner (Resident)
              </label>
              <select className="input" {...register('owner_id', { valueAsNumber: true })}>
                <option value="">Select owner</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.last_name}, {resident.first_name} {resident.middle_name || ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select if the owner is a registered resident
              </p>
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DTI Registration No.
              </label>
              <input
                type="text"
                className="input"
                placeholder="DTI number"
                {...register('dti_registration')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEC Registration No.
              </label>
              <input
                type="text"
                className="input"
                placeholder="SEC number"
                {...register('sec_registration')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BIR TIN</label>
              <input
                type="text"
                className="input"
                placeholder="TIN number"
                {...register('bir_tin')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Established
              </label>
              <input type="date" className="input" {...register('date_established')} />
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Address *
              </label>
              <input
                type="text"
                className={`input ${errors.address ? 'border-red-500' : ''}`}
                placeholder="Complete business address"
                {...register('address', { required: 'Address is required' })}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
              <input type="text" className="input" placeholder="Purok" {...register('purok')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor Area (sq.m.)
              </label>
              <input
                type="number"
                className="input"
                placeholder="0"
                {...register('floor_area', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                className="input"
                placeholder="09xxxxxxxxx"
                {...register('contact_number')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="business@email.com"
                {...register('email')}
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capital (₱)</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                {...register('capital', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gross Sales (₱)
              </label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                {...register('gross_sales', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Employees
              </label>
              <input
                type="number"
                className="input"
                placeholder="0"
                {...register('employees_count', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            className="input min-h-[100px]"
            placeholder="Any additional notes about this business..."
            {...register('notes')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/businesses" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : isEdit ? (
              'Update Business'
            ) : (
              'Register Business'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
