'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SearchParamsWrapper from './SearchParamsWrapper'
import Sidebar from '@/components/Sidebar'

interface FormData {
  from_id: string
  name: string
  kana: string
  phone: string
  email: string
  address: string
  work_history: string
  desired_conditions: string
}

interface FormErrors {
  [key: string]: string
}

function ApplicationFormContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState<FormData>({
    from_id: '',
    name: '',
    kana: '',
    phone: '',
    email: '',
    address: '',
    work_history: '',
    desired_conditions: ''
  })

  const handleParamsChange = useCallback((fromId: string | null) => {
    if (fromId) {
      setFormData(prev => ({ ...prev, from_id: fromId }))
    }
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.from_id) newErrors.from_id = '案件IDが必要です'
    if (!formData.name.trim()) newErrors.name = '氏名を入力してください'
    if (!formData.kana.trim()) newErrors.kana = 'ふりがなを入力してください'
    if (!formData.phone.trim()) newErrors.phone = '電話番号を入力してください'
    if (!formData.email.trim()) newErrors.email = 'メールアドレスを入力してください'
    if (!formData.address.trim()) newErrors.address = '現住所を入力してください'
    if (!formData.work_history.trim()) newErrors.work_history = '職歴を入力してください'
    if (!formData.desired_conditions.trim()) newErrors.desired_conditions = '希望条件を入力してください'

    // 電話番号の形式チェック
    if (formData.phone && !/^[\d-+()]+$/.test(formData.phone)) {
      newErrors.phone = '正しい電話番号を入力してください'
    }

    // メールアドレスの形式チェック
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('フォームデータ:', formData)
    console.log('バリデーション結果:', validateForm())
    
    if (!validateForm()) {
      console.log('バリデーションエラー:', errors)
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('applications')
        .insert([formData])

      if (error) throw error

      router.push('/apply/thanks')
    } catch (error) {
      console.error('Error submitting application:', error)
      setErrors({ submit: '送信に失敗しました。もう一度お試しください。' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsWrapper onParamsChange={handleParamsChange} />
      </Suspense>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            リゾートバイト応募フォーム
          </h1>
          
          {formData.from_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                <span className="font-semibold">応募案件ID:</span> {formData.from_id}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="from_id" className="block text-sm font-medium text-gray-700 mb-2">
                案件ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="from_id"
                name="from_id"
                value={formData.from_id}
                onChange={handleChange}
                placeholder="例: RESORT001"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.from_id ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.from_id && <p className="text-red-500 text-sm mt-1">{errors.from_id}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="kana" className="block text-sm font-medium text-gray-700 mb-2">
                  ふりがな <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="kana"
                  name="kana"
                  value={formData.kana}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.kana ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.kana && <p className="text-red-500 text-sm mt-1">{errors.kana}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                現住所 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div>
              <label htmlFor="work_history" className="block text-sm font-medium text-gray-700 mb-2">
                職歴 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="work_history"
                name="work_history"
                rows={4}
                value={formData.work_history}
                onChange={handleChange}
                placeholder="これまでのお仕事の経験をご記入ください"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.work_history ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.work_history && <p className="text-red-500 text-sm mt-1">{errors.work_history}</p>}
            </div>

            <div>
              <label htmlFor="desired_conditions" className="block text-sm font-medium text-gray-700 mb-2">
                希望条件 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="desired_conditions"
                name="desired_conditions"
                rows={4}
                value={formData.desired_conditions}
                onChange={handleChange}
                placeholder="勤務期間、勤務地、給与などのご希望をお聞かせください"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.desired_conditions ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.desired_conditions && <p className="text-red-500 text-sm mt-1">{errors.desired_conditions}</p>}
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? '送信中...' : '応募する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationForm() {
  return (
    <Sidebar>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }>
        <ApplicationFormContent />
      </Suspense>
    </Sidebar>
  )
}