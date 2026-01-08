import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { residentService } from '../../services/residentService'
import { householdService } from '../../services/householdService'
import type { Resident, Household } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type ResidentFormData = Omit<Resident, 'id' | 'barangay_id' | 'created_at' | 'updated_at'>

export default function ResidentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)
  const [households, setHouseholds] = useState<Household[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResidentFormData>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch households for dropdown
        const householdResponse = await householdService.getAll({ limit: 1000 })
        setHouseholds(householdResponse.data || householdResponse.households || [])

        // Fetch resident if editing
        if (id) {
          const resident = await residentService.getById(Number(id))
          reset({
            first_name: resident.first_name,
            middle_name: resident.middle_name || '',
            last_name: resident.last_name,
            suffix: resident.suffix || '',
            birthdate: resident.birthdate?.split('T')[0],
            birthplace: resident.birthplace || '',
            gender: resident.gender,
            civil_status: resident.civil_status,
            nationality: resident.nationality || 'Filipino',
            religion: resident.religion || '',
            email: resident.email || '',
            contact_number: resident.contact_number || '',
            address: resident.address,
            purok: resident.purok || '',
            household_id: resident.household_id || undefined,
            occupation: resident.occupation || '',
            monthly_income: resident.monthly_income || undefined,
            education: resident.education || '',
            is_voter: resident.is_voter || false,
            is_4ps_member: resident.is_4ps_member || false,
            is_pwd: resident.is_pwd || false,
            is_senior: resident.is_senior || false,
            is_solo_parent: resident.is_solo_parent || false,
            blood_type: resident.blood_type || '',
            height: resident.height || '',
            weight: resident.weight || '',
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

  const onSubmit = async (data: ResidentFormData) => {
    setIsLoading(true)
    try {
      if (isEdit) {
        await residentService.update(Number(id), data)
        toast.success('Resident updated successfully')
      } else {
        await residentService.create(data)
        toast.success('Resident created successfully')
      }
      navigate('/residents')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save resident')
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/residents"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Residents
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Resident' : 'Add New Resident'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>}
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
              {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate *</label>
              <input
                type="date"
                className={`input ${errors.birthdate ? 'border-red-500' : ''}`}
                {...register('birthdate', { required: 'Birthdate is required' })}
              />
              {errors.birthdate && <p className="mt-1 text-sm text-red-500">{errors.birthdate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthplace</label>
              <input type="text" className="input" {...register('birthplace')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                className={`input ${errors.gender ? 'border-red-500' : ''}`}
                {...register('gender', { required: 'Gender is required' })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status *</label>
              <select
                className={`input ${errors.civil_status ? 'border-red-500' : ''}`}
                {...register('civil_status', { required: 'Civil status is required' })}
              >
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="separated">Separated</option>
                <option value="divorced">Divorced</option>
              </select>
              {errors.civil_status && <p className="mt-1 text-sm text-red-500">{errors.civil_status.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <input type="text" className="input" defaultValue="Filipino" {...register('nationality')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
              <input type="text" className="input" {...register('religion')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              <select className="input" {...register('blood_type')}>
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" {...register('email')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input type="tel" className="input" placeholder="09xxxxxxxxx" {...register('contact_number')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                className={`input ${errors.address ? 'border-red-500' : ''}`}
                {...register('address', { required: 'Address is required' })}
              />
              {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
              <input type="text" className="input" {...register('purok')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Household</label>
              <select className="input" {...register('household_id')}>
                <option value="">No household</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.household_head_name || `Household #${h.id}`} - {h.address}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Economic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Economic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input type="text" className="input" {...register('occupation')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
              <input type="number" className="input" {...register('monthly_income')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highest Education</label>
              <select className="input" {...register('education')}>
                <option value="">Select</option>
                <option value="no_formal">No Formal Education</option>
                <option value="elementary">Elementary</option>
                <option value="high_school">High School</option>
                <option value="vocational">Vocational</option>
                <option value="college">College</option>
                <option value="postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status & Classification */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Classification</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600" {...register('is_voter')} />
              <span className="text-sm text-gray-700">Registered Voter</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600" {...register('is_4ps_member')} />
              <span className="text-sm text-gray-700">4Ps Member</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600" {...register('is_pwd')} />
              <span className="text-sm text-gray-700">PWD</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600" {...register('is_senior')} />
              <span className="text-sm text-gray-700">Senior Citizen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600" {...register('is_solo_parent')} />
              <span className="text-sm text-gray-700">Solo Parent</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/residents" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : isEdit ? (
              'Update Resident'
            ) : (
              'Create Resident'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
