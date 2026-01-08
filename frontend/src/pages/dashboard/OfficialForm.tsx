import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { officialService } from '../../services/otherServices'
import { residentService } from '../../services/residentService'
import type { Official, Resident } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type OfficialFormData = Omit<Official, 'id' | 'barangay_id' | 'created_at' | 'updated_at' | 'resident'>

export default function OfficialForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)
  const [residents, setResidents] = useState<Resident[]>([])

  const positions = officialService.getPositions()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<OfficialFormData>()

  const selectedResidentId = watch('resident_id')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch residents for dropdown
        const residentResponse = await residentService.getAll({ limit: 1000 })
        setResidents(residentResponse.data || residentResponse.residents || [])

        if (id) {
          const official = await officialService.getById(Number(id))
          reset({
            resident_id: official.resident_id,
            first_name: official.first_name,
            last_name: official.last_name,
            middle_name: official.middle_name || '',
            suffix: official.suffix || '',
            position: official.position,
            committee: official.committee || '',
            term_start: official.term_start?.split('T')[0] || '',
            term_end: official.term_end?.split('T')[0] || '',
            contact_number: official.contact_number || '',
            email: official.email || '',
            status: official.status,
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

  // Auto-fill from resident when selected
  useEffect(() => {
    if (selectedResidentId && !isEdit) {
      const resident = residents.find((r) => r.id === Number(selectedResidentId))
      if (resident) {
        reset((prev) => ({
          ...prev,
          first_name: resident.first_name,
          last_name: resident.last_name,
          middle_name: resident.middle_name || '',
          suffix: resident.suffix || '',
          contact_number: resident.contact_number || '',
          email: resident.email || '',
        }))
      }
    }
  }, [selectedResidentId, residents, reset, isEdit])

  const onSubmit = async (data: OfficialFormData) => {
    setIsLoading(true)
    try {
      if (isEdit) {
        await officialService.update(Number(id), data)
        toast.success('Official updated successfully')
      } else {
        await officialService.create(data)
        toast.success('Official added successfully')
      }
      navigate('/officials')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save official')
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
          to="/officials"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Officials
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Official' : 'Add New Official'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update official information' : 'Add a new barangay official'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Link to Resident */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Link to Resident</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Resident (Optional)
            </label>
            <select className="input" {...register('resident_id', { valueAsNumber: true })}>
              <option value="">-- Not linked to a resident --</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.last_name}, {resident.first_name} {resident.middle_name || ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Selecting a resident will auto-fill their information
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                className={`input ${errors.first_name ? 'border-red-500' : ''}`}
                {...register('first_name', { required: 'First name is required' })}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input type="text" className="input" {...register('middle_name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                {...register('last_name', { required: 'Last name is required' })}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
              <select className="input" {...register('suffix')}>
                <option value="">None</option>
                <option value="Jr.">Jr.</option>
                <option value="Sr.">Sr.</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
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
                placeholder="email@example.com"
                {...register('email')}
              />
            </div>
          </div>
        </div>

        {/* Position & Term */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Position & Term</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <select
                className={`input ${errors.position ? 'border-red-500' : ''}`}
                {...register('position', { required: 'Position is required' })}
              >
                <option value="">Select position</option>
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
              {errors.position && (
                <p className="mt-1 text-sm text-red-500">{errors.position.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Peace and Order, Health"
                {...register('committee')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term Start *</label>
              <input
                type="date"
                className={`input ${errors.term_start ? 'border-red-500' : ''}`}
                {...register('term_start', { required: 'Term start date is required' })}
              />
              {errors.term_start && (
                <p className="mt-1 text-sm text-red-500">{errors.term_start.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term End *</label>
              <input
                type="date"
                className={`input ${errors.term_end ? 'border-red-500' : ''}`}
                {...register('term_end', { required: 'Term end date is required' })}
              />
              {errors.term_end && (
                <p className="mt-1 text-sm text-red-500">{errors.term_end.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resigned">Resigned</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/officials" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : isEdit ? (
              'Update Official'
            ) : (
              'Add Official'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
