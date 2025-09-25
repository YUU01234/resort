'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase, type Application } from '@/lib/supabase'

interface FilterState {
  from_id: string
  name: string
  status: string
  date_from: string
  date_to: string
}

const STATUS_OPTIONS = ['応募済み', '面接済み', '採用', '不採用', '辞退']

function AdminPageContent() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  
  const [filters, setFilters] = useState<FilterState>({
    from_id: '',
    name: '',
    status: '',
    date_from: '',
    date_to: ''
  })

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters])

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = applications

    if (filters.from_id) {
      filtered = filtered.filter(app => 
        app.from_id.toLowerCase().includes(filters.from_id.toLowerCase())
      )
    }

    if (filters.name) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(filters.name.toLowerCase())
      )
    }

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status)
    }

    if (filters.date_from) {
      filtered = filtered.filter(app => 
        new Date(app.created_at) >= new Date(filters.date_from)
      )
    }

    if (filters.date_to) {
      filtered = filtered.filter(app => 
        new Date(app.created_at) <= new Date(filters.date_to + 'T23:59:59')
      )
    }

    setFilteredApplications(filtered)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, status: newStatus } : app
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const exportToCSV = () => {
    const headers = [
      '応募日時', '案件ID', '氏名', 'ふりがな', '電話番号', 
      'メールアドレス', '現住所', '職歴', '希望条件', 'ステータス'
    ]
    
    const csvContent = [
      headers.join(','),
      ...filteredApplications.map(app => [
        new Date(app.created_at).toLocaleString('ja-JP'),
        app.from_id,
        `"${app.name.replace(/"/g, '""')}"`,
        `"${app.kana.replace(/"/g, '""')}"`,
        app.phone,
        app.email,
        `"${app.address.replace(/"/g, '""')}"`,
        `"${app.work_history.replace(/"/g, '""')}"`,
        `"${app.desired_conditions.replace(/"/g, '""')}"`,
        app.status
      ].join(','))
    ].join('\r\n')

    // BOM（Byte Order Mark）を追加してUTF-8として正しく認識させる
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent
    
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      from_id: '',
      name: '',
      status: '',
      date_from: '',
      date_to: ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">応募管理</h1>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            CSVダウンロード ({filteredApplications.length}件)
          </button>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                案件ID
              </label>
              <input
                type="text"
                value={filters.from_id}
                onChange={(e) => handleFilterChange('from_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="案件IDで検索"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名
              </label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="氏名で検索"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">全て</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了日
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              フィルタをクリア
            </button>
          </div>
        </div>

        {/* 応募一覧 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    応募日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    案件ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(application.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.from_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {application.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={application.status}
                        onChange={(e) => updateStatus(application.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedApp(application)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">該当する応募データがありません。</p>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">応募詳細</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">応募日時</h3>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedApp.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">案件ID</h3>
                    <p className="text-sm text-gray-900">{selectedApp.from_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">氏名</h3>
                    <p className="text-sm text-gray-900">{selectedApp.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">ふりがな</h3>
                    <p className="text-sm text-gray-900">{selectedApp.kana}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">電話番号</h3>
                    <p className="text-sm text-gray-900">{selectedApp.phone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">メールアドレス</h3>
                    <p className="text-sm text-gray-900">{selectedApp.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">現住所</h3>
                  <p className="text-sm text-gray-900">{selectedApp.address}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">職歴</h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApp.work_history}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">希望条件</h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApp.desired_conditions}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">ステータス</h3>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => {
                      updateStatus(selectedApp.id, e.target.value)
                      setSelectedApp({ ...selectedApp, status: e.target.value })
                    }}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  )
}