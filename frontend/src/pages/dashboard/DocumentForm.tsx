import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { documentService } from '../../services/documentService'
import { residentService } from '../../services/residentService'
import type { Document, Resident } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type DocumentFormData = Omit<Document, 'id' | 'barangay_id' | 'created_at' | 'updated_at' | 'resident' | 'processor' | 'control_number'>

export default function DocumentForm() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [residents, setResidents] = useState<Resident[]>([])
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)

  const documentTypes = documentService.getDocumentTypes()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DocumentFormData>({
    defaultValues: {
      status: 'pending',
      amount: 0,
    },
  })

  const selectedResidentId = watch('resident_id')
  const selectedDocType = watch('document_type')

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await residentService.getAll({ limit: 1000 })
        setResidents(response.data || response.residents || [])
      } catch (error) {
        console.error('Failed to fetch residents:', error)
        toast.error('Failed to load residents')
      } finally {
        setIsFetching(false)
      }
    }
    fetchResidents()
  }, [])

  // Update selected resident info when resident changes
  useEffect(() => {
    if (selectedResidentId) {
      const resident = residents.find((r) => r.id === Number(selectedResidentId))
      setSelectedResident(resident || null)
    } else {
      setSelectedResident(null)
    }
  }, [selectedResidentId, residents])

  // Update fee when document type changes
  useEffect(() => {
    if (selectedDocType) {
      const docType = documentTypes.find((t) => t.value === selectedDocType)
      if (docType) {
        setValue('amount', docType.fee)
      }
    }
  }, [selectedDocType, setValue, documentTypes])

  const onSubmit = async (data: DocumentFormData) => {
    setIsLoading(true)
    try {
      await documentService.create(data)
      toast.success('Document request created successfully')
      navigate('/documents')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to create document request')
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
          to="/documents"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Documents
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Issue New Document</h1>
        <p className="text-gray-500 mt-1">Create a new document request for a resident</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Resident Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resident Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Resident *
              </label>
              <select
                className={`input ${errors.resident_id ? 'border-red-500' : ''}`}
                {...register('resident_id', {
                  required: 'Please select a resident',
                  valueAsNumber: true,
                })}
              >
                <option value="">-- Select a resident --</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.last_name}, {resident.first_name} {resident.middle_name || ''} -{' '}
                    {resident.address}
                  </option>
                ))}
              </select>
              {errors.resident_id && (
                <p className="mt-1 text-sm text-red-500">{errors.resident_id.message}</p>
              )}
            </div>

            {/* Selected Resident Info */}
            {selectedResident && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Resident Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">
                      {selectedResident.first_name} {selectedResident.middle_name || ''}{' '}
                      {selectedResident.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <p className="font-medium capitalize">{selectedResident.gender}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Civil Status:</span>
                    <p className="font-medium capitalize">{selectedResident.civil_status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p className="font-medium">{selectedResident.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type *
              </label>
              <select
                className={`input ${errors.document_type ? 'border-red-500' : ''}`}
                {...register('document_type', { required: 'Document type is required' })}
              >
                <option value="">Select document type</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - ₱{type.fee}
                  </option>
                ))}
              </select>
              {errors.document_type && (
                <p className="mt-1 text-sm text-red-500">{errors.document_type.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" {...register('status')}>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready for Release</option>
                <option value="released">Released</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <input
                type="text"
                className={`input ${errors.purpose ? 'border-red-500' : ''}`}
                placeholder="e.g., Employment, School Requirement, Loan Application"
                {...register('purpose', { required: 'Purpose is required' })}
              />
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-500">{errors.purpose.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
              <input
                type="number"
                className="input"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OR Number</label>
              <input
                type="text"
                className="input"
                placeholder="Official Receipt Number"
                {...register('or_number')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input type="date" className="input" {...register('valid_until')} />
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
          <Link to="/documents" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </>
            ) : (
              'Create Document Request'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
