import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { announcementService } from '../../services/otherServices'
import type { Announcement } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type AnnouncementFormData = Omit<Announcement, 'id' | 'barangay_id' | 'created_at' | 'updated_at' | 'creator' | 'views'>

export default function AnnouncementForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)

  const categories = announcementService.getCategories()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    defaultValues: {
      priority: 'normal',
      status: 'draft',
      is_public: true,
      is_pinned: false,
    },
  })

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return
      try {
        const announcement = await announcementService.getById(Number(id))
        reset({
          title: announcement.title,
          content: announcement.content,
          excerpt: announcement.excerpt || '',
          category: announcement.category,
          priority: announcement.priority,
          is_public: announcement.is_public,
          is_pinned: announcement.is_pinned,
          publish_date: announcement.publish_date?.split('T')[0] || '',
          expiry_date: announcement.expiry_date?.split('T')[0] || '',
          status: announcement.status,
        })
      } catch (error) {
        console.error('Failed to fetch announcement:', error)
        toast.error('Failed to load announcement')
        navigate('/announcements')
      } finally {
        setIsFetching(false)
      }
    }
    fetchAnnouncement()
  }, [id, reset, navigate])

  const onSubmit = async (data: AnnouncementFormData) => {
    setIsLoading(true)
    try {
      if (isEdit) {
        await announcementService.update(Number(id), data)
        toast.success('Announcement updated successfully')
      } else {
        await announcementService.create(data)
        toast.success('Announcement created successfully')
      }
      navigate('/announcements')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save announcement')
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
          to="/announcements"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Announcements
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Announcement' : 'Create New Announcement'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update announcement details' : 'Create a new barangay announcement'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Announcement Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter announcement title"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                className={`input min-h-[200px] ${errors.content ? 'border-red-500' : ''}`}
                placeholder="Write your announcement content here..."
                {...register('content', { required: 'Content is required' })}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt (Short Summary)
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="A brief summary that will be shown in listings..."
                {...register('excerpt')}
              />
            </div>
          </div>
        </div>

        {/* Category & Priority */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category & Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                className={`input ${errors.category ? 'border-red-500' : ''}`}
                {...register('category', { required: 'Category is required' })}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input" {...register('priority')}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" {...register('status')}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Publishing Options */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Publishing Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
              <input type="date" className="input" {...register('publish_date')} />
              <p className="mt-1 text-xs text-gray-500">Leave empty to publish immediately</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" className="input" {...register('expiry_date')} />
              <p className="mt-1 text-xs text-gray-500">Leave empty for no expiration</p>
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('is_public')}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Public Announcement</span>
                  <p className="text-xs text-gray-500">Visible to all residents</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('is_pinned')}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Pin Announcement</span>
                  <p className="text-xs text-gray-500">Keep this announcement at the top</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/announcements" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : isEdit ? (
              'Update Announcement'
            ) : (
              'Create Announcement'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
