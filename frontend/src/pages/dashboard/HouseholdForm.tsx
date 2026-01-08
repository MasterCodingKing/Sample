import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { householdService } from '../../services/householdService'
import type { Household } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type HouseholdFormData = Omit<Household, 'id' | 'barangay_id' | 'created_at' | 'updated_at' | 'residents' | 'barangay'>

export default function HouseholdForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HouseholdFormData>()

  useEffect(() => {
    const fetchHousehold = async () => {
      if (!id) return
      try {
        const household = await householdService.getById(Number(id))
        reset({
          household_number: household.household_number,
          address: household.address,
          purok: household.purok || '',
          zone: household.zone || '',
          housing_type: household.housing_type,
          house_condition: household.house_condition,
          toilet_type: household.toilet_type,
          water_source: household.water_source,
          electricity: household.electricity,
          monthly_income: household.monthly_income,
          income_source: household.income_source || '',
          is_4ps_beneficiary: household.is_4ps_beneficiary,
          notes: household.notes || '',
          status: household.status,
        })
      } catch (error) {
        console.error('Failed to fetch household:', error)
        toast.error('Failed to load household data')
        navigate('/households')
      } finally {
        setIsFetching(false)
      }
    }
    fetchHousehold()
  }, [id, reset, navigate])

  const onSubmit = async (data: HouseholdFormData) => {
    setIsLoading(true)
    try {
      if (isEdit) {
        await householdService.update(Number(id), data)
        toast.success('Household updated successfully')
      } else {
        await householdService.create(data)
        toast.success('Household created successfully')
      }
      navigate('/households')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save household')
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
          to="/households"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Households
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Household' : 'Add New Household'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update household information' : 'Register a new household in the barangay'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Household Number
              </label>
              <input
                type="text"
                className={`input ${errors.household_number ? 'border-red-500' : ''}`}
                placeholder="e.g., HH-001"
                {...register('household_number', { required: 'Household number is required' })}
              />
              {errors.household_number && (
                <p className="mt-1 text-sm text-red-500">{errors.household_number.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                className={`input ${errors.address ? 'border-red-500' : ''}`}
                placeholder="Complete address"
                {...register('address', { required: 'Address is required' })}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Purok 1"
                {...register('purok')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Zone 1"
                {...register('zone')}
              />
            </div>
          </div>
        </div>

        {/* Housing Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Housing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Housing Type *</label>
              <select
                className={`input ${errors.housing_type ? 'border-red-500' : ''}`}
                {...register('housing_type', { required: 'Housing type is required' })}
              >
                <option value="">Select type</option>
                <option value="owned">Owned</option>
                <option value="rented">Rented</option>
                <option value="shared">Shared</option>
                <option value="informal_settler">Informal Settler</option>
              </select>
              {errors.housing_type && (
                <p className="mt-1 text-sm text-red-500">{errors.housing_type.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Condition *
              </label>
              <select
                className={`input ${errors.house_condition ? 'border-red-500' : ''}`}
                {...register('house_condition', { required: 'House condition is required' })}
              >
                <option value="">Select condition</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="dilapidated">Dilapidated</option>
              </select>
              {errors.house_condition && (
                <p className="mt-1 text-sm text-red-500">{errors.house_condition.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toilet Type</label>
              <select className="input" {...register('toilet_type')}>
                <option value="">Select type</option>
                <option value="water_sealed">Water Sealed</option>
                <option value="pit">Pit</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water Source</label>
              <select className="input" {...register('water_source')}>
                <option value="">Select source</option>
                <option value="piped">Piped Water</option>
                <option value="well">Well</option>
                <option value="spring">Spring</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('electricity')}
                />
                <span className="text-sm font-medium text-gray-700">Has Electricity</span>
              </label>
            </div>
          </div>
        </div>

        {/* Economic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Economic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Household Income
              </label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                {...register('monthly_income', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Income Source
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Employment, Business, Farming"
                {...register('income_source')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('is_4ps_beneficiary')}
                />
                <span className="text-sm font-medium text-gray-700">4Ps Beneficiary</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            className="input min-h-[100px]"
            placeholder="Any additional notes about this household..."
            {...register('notes')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/households" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : isEdit ? (
              'Update Household'
            ) : (
              'Create Household'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
