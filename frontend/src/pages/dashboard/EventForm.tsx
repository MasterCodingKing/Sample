import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { eventService } from '../../services/otherServices'
import type { Event } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type EventFormData = Omit<Event, 'id' | 'barangay_id' | 'created_at' | 'updated_at' | 'creator'>

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)

  const eventTypes = eventService.getEventTypes()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      all_day: false,
      registration_required: false,
      is_public: true,
      status: 'upcoming',
    },
  })

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return
      try {
        const event = await eventService.getById(Number(id))
        reset({
          title: event.title,
          description: event.description || '',
          event_type: event.event_type,
          start_date: event.start_date?.split('T')[0] || '',
          end_date: event.end_date?.split('T')[0] || '',
          all_day: event.all_day,
          location: event.location || '',
          venue_details: event.venue_details || '',
          organizer: event.organizer || '',
          contact_person: event.contact_person || '',
          contact_number: event.contact_number || '',
          max_participants: event.max_participants,
          registration_required: event.registration_required,
          registration_deadline: event.registration_deadline?.split('T')[0] || '',
          is_public: event.is_public,
          status: event.status,
          notes: event.notes || '',
        })
      } catch (error) {
        console.error('Failed to fetch event:', error)
        toast.error('Failed to load event')
        navigate('/events')
      } finally {
        setIsFetching(false)
      }
    }
    fetchEvent()
  }, [id, reset, navigate])

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    try {
      if (isEdit) {
        await eventService.update(Number(id), data)
        toast.success('Event updated successfully')
      } else {
        await eventService.create(data)
        toast.success('Event created successfully')
      }
      navigate('/events')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save event')
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
          to="/events"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Events
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update event details' : 'Schedule a new barangay event'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  className={`input ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Enter event title"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                <select
                  className={`input ${errors.event_type ? 'border-red-500' : ''}`}
                  {...register('event_type', { required: 'Event type is required' })}
                >
                  <option value="">Select type</option>
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.event_type && (
                  <p className="mt-1 text-sm text-red-500">{errors.event_type.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input" {...register('status')}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input min-h-[120px]"
                placeholder="Describe the event..."
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                className={`input ${errors.start_date ? 'border-red-500' : ''}`}
                {...register('start_date', { required: 'Start date is required' })}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-500">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="input" {...register('end_date')} />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('all_day')}
                />
                <span className="text-sm font-medium text-gray-700">All Day Event</span>
              </label>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Barangay Hall"
                {...register('location')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Details</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 2nd Floor, Function Room"
                {...register('venue_details')}
              />
            </div>
          </div>
        </div>

        {/* Organizer & Contact */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizer & Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
              <input
                type="text"
                className="input"
                placeholder="Organizing committee/person"
                {...register('organizer')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input type="text" className="input" placeholder="Name" {...register('contact_person')} />
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
          </div>
        </div>

        {/* Registration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('registration_required')}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Registration Required</span>
                  <p className="text-xs text-gray-500">Participants need to register for this event</p>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Participants
              </label>
              <input
                type="number"
                className="input"
                placeholder="Leave empty for unlimited"
                {...register('max_participants', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Deadline
              </label>
              <input type="date" className="input" {...register('registration_deadline')} />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('is_public')}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Public Event</span>
                  <p className="text-xs text-gray-500">Visible to all residents</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            className="input min-h-[100px]"
            placeholder="Any additional notes about this event..."
            {...register('notes')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/events" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : isEdit ? (
              'Update Event'
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
