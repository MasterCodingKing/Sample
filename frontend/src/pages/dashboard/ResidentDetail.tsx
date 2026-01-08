import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { residentService } from '../../services/residentService'
import type { Resident } from '../../types'
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ResidentDetail() {
  const { id } = useParams()
  const [resident, setResident] = useState<Resident | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResident = async () => {
      if (!id) return
      try {
        const data = await residentService.getById(Number(id))
        setResident(data)
      } catch (error) {
        console.error('Failed to fetch resident:', error)
        toast.error('Failed to load resident details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchResident()
  }, [id])

  const getAge = (birthdate: string) => {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!resident) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Resident not found</p>
        <Link to="/residents" className="btn btn-primary mt-4">
          Back to Residents
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/residents"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {resident.first_name} {resident.middle_name?.[0] ? `${resident.middle_name[0]}.` : ''} {resident.last_name} {resident.suffix || ''}
            </h1>
            <p className="text-gray-500">Resident Profile</p>
          </div>
        </div>
        <Link to={`/residents/${id}/edit`} className="btn btn-primary inline-flex items-center gap-2">
          <PencilIcon className="w-5 h-5" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo & Basic Info */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="w-32 h-32 rounded-full bg-primary-100 mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {resident.photo_url ? (
                <img src={resident.photo_url} alt={resident.first_name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-16 h-16 text-primary-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {resident.first_name} {resident.last_name}
            </h2>
            <p className="text-gray-500 capitalize">{resident.gender} • {getAge(resident.birthdate)} years old</p>

            <div className="mt-6 space-y-3 text-left">
              {resident.contact_number && (
                <div className="flex items-center gap-3 text-sm">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <span>{resident.contact_number}</span>
                </div>
              )}
              {resident.email && (
                <div className="flex items-center gap-3 text-sm">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <span>{resident.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span>{resident.address}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-2 justify-center">
              {resident.is_voter && <span className="badge badge-green">Voter</span>}
              {resident.is_4ps_member && <span className="badge badge-blue">4Ps</span>}
              {resident.is_pwd && <span className="badge badge-purple">PWD</span>}
              {resident.is_senior && <span className="badge badge-yellow">Senior</span>}
              {resident.is_solo_parent && <span className="badge badge-pink">Solo Parent</span>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IdentificationIcon className="w-5 h-5 text-primary-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{resident.first_name} {resident.middle_name} {resident.last_name} {resident.suffix}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Birthdate</p>
                <p className="font-medium">{new Date(resident.birthdate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{getAge(resident.birthdate)} years old</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Birthplace</p>
                <p className="font-medium">{resident.birthplace || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium capitalize">{resident.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Civil Status</p>
                <p className="font-medium capitalize">{resident.civil_status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nationality</p>
                <p className="font-medium">{resident.nationality || 'Filipino'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Religion</p>
                <p className="font-medium">{resident.religion || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Type</p>
                <p className="font-medium">{resident.blood_type || '-'}</p>
              </div>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-primary-600" />
              Contact & Address
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{resident.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Number</p>
                <p className="font-medium">{resident.contact_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Purok</p>
                <p className="font-medium">{resident.purok || '-'}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{resident.address}</p>
              </div>
            </div>
          </div>

          {/* Economic Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              Economic Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="font-medium">{resident.occupation || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Income</p>
                <p className="font-medium">{resident.monthly_income ? `₱${resident.monthly_income.toLocaleString()}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Education</p>
                <p className="font-medium capitalize">{resident.education?.replace('_', ' ') || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
