import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { incidentService } from '../../services/incidentService'
import { residentService } from '../../services/residentService'
import type { Incident, Resident } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type IncidentFormData = Omit<Incident, 'id' | 'barangay_id' | 'created_at' | 'updated_at' | 'complainant' | 'respondent' | 'recorder'>

export default function IncidentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)
  const [residents, setResidents] = useState<Resident[]>([])

  const incidentTypes = incidentService.getIncidentTypes()
  const statusOptions = incidentService.getStatusOptions()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<IncidentFormData>({
    defaultValues: {
      status: 'reported',
      priority: 'medium',
    },
  })

  const selectedComplainantId = watch('complainant_id')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch residents for dropdowns
        const residentResponse = await residentService.getAll({ limit: 1000 })
        setResidents(residentResponse.data || residentResponse.residents || [])

        if (id) {
          const incident = await incidentService.getById(Number(id))
          reset({
            blotter_number: incident.blotter_number,
            incident_type: incident.incident_type,
            incident_date: incident.incident_date?.split('T')[0] || '',
            incident_time: incident.incident_time || '',
            incident_location: incident.incident_location,
            complainant_id: incident.complainant_id,
            complainant_name: incident.complainant_name,
            complainant_address: incident.complainant_address || '',
            complainant_contact: incident.complainant_contact || '',
            respondent_id: incident.respondent_id,
            respondent_name: incident.respondent_name || '',
            respondent_address: incident.respondent_address || '',
            respondent_contact: incident.respondent_contact || '',
            narrative: incident.narrative,
            action_taken: incident.action_taken || '',
            hearing_date: incident.hearing_date?.split('T')[0] || '',
            resolution: incident.resolution || '',
            resolution_date: incident.resolution_date?.split('T')[0] || '',
            status: incident.status,
            priority: incident.priority,
            witnesses: incident.witnesses || '',
            notes: incident.notes || '',
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

  // Auto-fill complainant info when resident is selected
  useEffect(() => {
    if (selectedComplainantId && !isEdit) {
      const resident = residents.find((r) => r.id === Number(selectedComplainantId))
      if (resident) {
        reset((prev) => ({
          ...prev,
          complainant_name: `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim(),
          complainant_address: resident.address || '',
          complainant_contact: resident.contact_number || '',
        }))
      }
    }
  }, [selectedComplainantId, residents, reset, isEdit])

  const onSubmit = async (data: IncidentFormData) => {
    setIsLoading(true)
    try {
      if (isEdit) {
        await incidentService.update(Number(id), data)
        toast.success('Incident updated successfully')
      } else {
        await incidentService.create(data)
        toast.success('Incident reported successfully')
      }
      navigate('/incidents')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save incident')
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
          to="/incidents"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Incidents
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Incident Report' : 'Report New Incident'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update incident details' : 'File a new barangay incident/blotter report'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Incident Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blotter Number
              </label>
              <input
                type="text"
                className="input"
                placeholder="Auto-generated if blank"
                {...register('blotter_number')}
              />
              <p className="mt-1 text-xs text-gray-500">Leave empty for auto-generation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type *
              </label>
              <select
                className={`input ${errors.incident_type ? 'border-red-500' : ''}`}
                {...register('incident_type', { required: 'Incident type is required' })}
              >
                <option value="">Select type</option>
                {incidentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.incident_type && (
                <p className="mt-1 text-sm text-red-500">{errors.incident_type.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Date *
              </label>
              <input
                type="date"
                className={`input ${errors.incident_date ? 'border-red-500' : ''}`}
                {...register('incident_date', { required: 'Date is required' })}
              />
              {errors.incident_date && (
                <p className="mt-1 text-sm text-red-500">{errors.incident_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Time</label>
              <input type="time" className="input" {...register('incident_time')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Location *
              </label>
              <input
                type="text"
                className={`input ${errors.incident_location ? 'border-red-500' : ''}`}
                placeholder="Where did the incident occur?"
                {...register('incident_location', { required: 'Location is required' })}
              />
              {errors.incident_location && (
                <p className="mt-1 text-sm text-red-500">{errors.incident_location.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input" {...register('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" {...register('status')}>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Complainant Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Complainant Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Resident (Optional)
              </label>
              <select className="input" {...register('complainant_id', { valueAsNumber: true })}>
                <option value="">-- Not a registered resident --</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.last_name}, {resident.first_name} {resident.middle_name || ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complainant Name *
              </label>
              <input
                type="text"
                className={`input ${errors.complainant_name ? 'border-red-500' : ''}`}
                placeholder="Full name"
                {...register('complainant_name', { required: 'Complainant name is required' })}
              />
              {errors.complainant_name && (
                <p className="mt-1 text-sm text-red-500">{errors.complainant_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                className="input"
                placeholder="09xxxxxxxxx"
                {...register('complainant_contact')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                className="input"
                placeholder="Complete address"
                {...register('complainant_address')}
              />
            </div>
          </div>
        </div>

        {/* Respondent Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Respondent Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Resident (Optional)
              </label>
              <select className="input" {...register('respondent_id', { valueAsNumber: true })}>
                <option value="">-- Not a registered resident / Unknown --</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.last_name}, {resident.first_name} {resident.middle_name || ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respondent Name</label>
              <input
                type="text"
                className="input"
                placeholder="Full name (if known)"
                {...register('respondent_name')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                className="input"
                placeholder="09xxxxxxxxx"
                {...register('respondent_contact')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                className="input"
                placeholder="Complete address"
                {...register('respondent_address')}
              />
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Narrative</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narrative / Statement *
              </label>
              <textarea
                className={`input min-h-[150px] ${errors.narrative ? 'border-red-500' : ''}`}
                placeholder="Provide a detailed account of the incident..."
                {...register('narrative', { required: 'Narrative is required' })}
              />
              {errors.narrative && (
                <p className="mt-1 text-sm text-red-500">{errors.narrative.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Witnesses</label>
              <input
                type="text"
                className="input"
                placeholder="Names of witnesses (comma-separated)"
                {...register('witnesses')}
              />
            </div>
          </div>
        </div>

        {/* Resolution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Action & Resolution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Describe actions taken..."
                {...register('action_taken')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Date</label>
              <input type="date" className="input" {...register('hearing_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Date</label>
              <input type="date" className="input" {...register('resolution_date')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Describe the resolution..."
                {...register('resolution')}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            className="input min-h-[100px]"
            placeholder="Any additional notes..."
            {...register('notes')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/incidents" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : isEdit ? (
              'Update Incident'
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
