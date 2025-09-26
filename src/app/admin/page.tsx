'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { supabase, type Application } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface FilterState {
  from_id: string
  name: string
  status: string
  person_in_charge: string
  date_from: string
  date_to: string
}

const STATUS_OPTIONS = ['応募済み', '面接予定', '面接済み', '採用', '不採用', '辞退']
const PERSON_IN_CHARGE_OPTIONS = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山田', '中村', '小林', '加藤']

function AdminPageContent() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'status'>('list')
  
  const [filters, setFilters] = useState<FilterState>({
    from_id: '',
    name: '',
    status: '',
    person_in_charge: '',
    date_from: '',
    date_to: ''
  })

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

  const applyFilters = useCallback(() => {
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

    if (filters.person_in_charge) {
      filtered = filtered.filter(app =>
        app.person_in_charge && app.person_in_charge.toLowerCase().includes(filters.person_in_charge.toLowerCase())
      )
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
  }, [applications, filters])

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters, applyFilters])

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

  const updatePersonInCharge = async (id: string, personInCharge: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ person_in_charge: personInCharge, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, person_in_charge: personInCharge } : app
        )
      )
    } catch (error) {
      console.error('Error updating person in charge:', error)
    }
  }

  const updateInterviewSchedule = async (id: string, interviewData: {
    interview_date: string | null
    interview_time: string | null
    interview_location: string | null
    interview_notes: string | null
  }) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ ...interviewData, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, ...interviewData } : app
        )
      )

      if (selectedApp && selectedApp.id === id) {
        setSelectedApp({ ...selectedApp, ...interviewData })
      }
    } catch (error) {
      console.error('Error updating interview schedule:', error)
    }
  }

  const exportToCSV = () => {
    const headers = [
      '応募日時', '案件ID', '氏名', 'ふりがな', '電話番号',
      'メールアドレス', '現住所', '職歴', '希望条件', 'ステータス',
      '担当者', '面接日', '面接時間', '面接場所', '面接備考'
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
        app.status,
        app.person_in_charge || '',
        app.interview_date || '',
        app.interview_time || '',
        `"${(app.interview_location || '').replace(/"/g, '""')}"`,
        `"${(app.interview_notes || '').replace(/"/g, '""')}"`
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
      person_in_charge: '',
      date_from: '',
      date_to: ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">応募管理</h1>
                <p className="text-gray-600 mt-1">応募データの確認と管理</p>
              </div>
            </div>

            <button
              onClick={exportToCSV}
              className="bg-teal-400 hover:bg-teal-500 text-white px-4 py-2 rounded-md transition-colors font-medium flex items-center gap-2"
              style={{ backgroundColor: '#4FD1C5' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#38B2AC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4FD1C5'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              CSV出力 ({filteredApplications.length})
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-2xl font-semibold text-gray-900">{applications.length}</div>
                  <div className="text-sm text-gray-600">総応募数</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-2xl font-semibold text-gray-900">{filteredApplications.length}</div>
                  <div className="text-sm text-gray-600">表示中</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-2xl font-semibold text-gray-900">
                    {applications.filter(app => app.status === '採用').length}
                  </div>
                  <div className="text-sm text-gray-600">採用済み</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-2xl font-semibold text-gray-900">
                    {applications.filter(app => {
                      const today = new Date().toDateString()
                      return new Date(app.created_at).toDateString() === today
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">今日の応募</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-teal-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-medium text-gray-900">フィルター</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                案件ID
              </label>
              <input
                type="text"
                value={filters.from_id}
                onChange={(e) => handleFilterChange('from_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                placeholder="案件ID"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                placeholder="氏名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
              >
                <option value="">すべて</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                担当者
              </label>
              <select
                value={filters.person_in_charge}
                onChange={(e) => handleFilterChange('person_in_charge', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
              >
                <option value="">すべて</option>
                {PERSON_IN_CHARGE_OPTIONS.map(person => (
                  <option key={person} value={person}>{person}</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              リセット
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-teal-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">表示切替</h3>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                一覧表示
              </button>
              <button
                onClick={() => setViewMode('status')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'status'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 000 2h.01a1 1 0 100-2H3zM4.172 6H7a1 1 0 110 2H4.172a1 1 0 11-1.415-1.414L4.172 6zM3 10a1 1 0 100 2h.01a1 1 0 100-2H3zM4.172 12H7a1 1 0 110 2H4.172a1 1 0 11-1.415-1.414L4.172 12zM3 16a1 1 0 100 2h.01a1 1 0 100-2H3zM4.172 18H7a1 1 0 110 2H4.172a1 1 0 11-1.415-1.414L4.172 18z" />
                </svg>
                ステータス別
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* List View */
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-teal-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">応募一覧</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {filteredApplications.length} / {applications.length} 件
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      応募日時
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      案件ID
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      氏名
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="m18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      連絡先
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      担当者
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      ステータス
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      面接日
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                      操作
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredApplications.map((application, index) => (
                  <tr key={application.id} className={`hover:bg-teal-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{new Date(application.created_at).toLocaleDateString('ja-JP')}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(application.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm-1 4a1 1 0 100-2H8a1 1 0 100 2h4z" clipRule="evenodd" />
                        </svg>
                        {application.from_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-xs text-gray-500">{application.kana}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        {application.phone}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <svg className="w-3 h-3 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="m18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        {application.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={application.person_in_charge || ''}
                        onChange={(e) => updatePersonInCharge(application.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                      >
                        <option value="">未設定</option>
                        {PERSON_IN_CHARGE_OPTIONS.map(person => (
                          <option key={person} value={person}>{person}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={application.status}
                        onChange={(e) => updateStatus(application.id, e.target.value)}
                        className={`text-xs rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-teal-400 ${
                          application.status === '採用' ? 'bg-green-100 text-green-800' :
                          application.status === '不採用' ? 'bg-red-100 text-red-800' :
                          application.status === '面接済み' ? 'bg-blue-100 text-blue-800' :
                          application.status === '面接予定' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {application.interview_date ? (
                        <div className="text-sm">
                          <div className="flex items-center text-gray-900 font-medium">
                            <svg className="w-4 h-4 mr-1 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {new Date(application.interview_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                          </div>
                          {application.interview_time && (
                            <div className="text-xs text-gray-500 ml-5">
                              {application.interview_time}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedApp(application)}
                        className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full hover:bg-teal-200 transition-colors"
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">該当する応募データがありません。</p>
            </div>
          )}
        </div>
        ) : (
          /* Status View - Horizontal Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Row 1 */}
            {/* 1. 応募 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">1. 応募済み</h3>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {applications.filter(app => app.status === '応募済み').length}件
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {applications.filter(app => app.status === '応募済み').map((app) => (
                  <div key={app.id} onClick={() => setSelectedApp(app)} className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{app.name}</div>
                        <div className="text-sm text-gray-500">{app.from_id} | {new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{app.phone}</div>
                        <div className="text-xs text-gray-500">{app.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {applications.filter(app => app.status === '応募済み').length === 0 && (
                  <div className="text-center py-8 text-gray-500">応募済みのデータがありません</div>
                )}
              </div>
            </div>

            {/* 2. 面接予定 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">2. 面接予定</h3>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {applications.filter(app => app.status === '面接予定').length}件
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {applications.filter(app => app.status === '面接予定').map((app) => (
                  <div key={app.id} onClick={() => setSelectedApp(app)} className="p-3 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{app.name}</div>
                        <div className="text-sm text-gray-500">{app.from_id} | {new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                        {app.interview_date && (
                          <div className="text-sm text-purple-600 mt-1">
                            面接日: {new Date(app.interview_date).toLocaleDateString('ja-JP')} {app.interview_time || ''}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{app.phone}</div>
                        <div className="text-xs text-gray-500">{app.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {applications.filter(app => app.status === '面接予定').length === 0 && (
                  <div className="text-center py-8 text-gray-500">面接予定のデータがありません</div>
                )}
              </div>
            </div>

            {/* Row 2 */}
            {/* 3-1. 採用 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">3-1. 採用</h3>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {applications.filter(app => app.status === '採用').length}件
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {applications.filter(app => app.status === '採用').map((app) => (
                  <div key={app.id} onClick={() => setSelectedApp(app)} className="p-3 bg-gray-50 rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{app.name}</div>
                        <div className="text-sm text-gray-500">{app.from_id} | {new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{app.phone}</div>
                        <div className="text-xs text-gray-500">{app.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {applications.filter(app => app.status === '採用').length === 0 && (
                  <div className="text-center py-8 text-gray-500">採用のデータがありません</div>
                )}
              </div>
            </div>

            {/* 3-2. 不採用 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">3-2. 不採用</h3>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {applications.filter(app => app.status === '不採用').length}件
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {applications.filter(app => app.status === '不採用').map((app) => (
                  <div key={app.id} onClick={() => setSelectedApp(app)} className="p-3 bg-gray-50 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{app.name}</div>
                        <div className="text-sm text-gray-500">{app.from_id} | {new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{app.phone}</div>
                        <div className="text-xs text-gray-500">{app.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {applications.filter(app => app.status === '不採用').length === 0 && (
                  <div className="text-center py-8 text-gray-500">不採用のデータがありません</div>
                )}
              </div>
            </div>

            {/* Row 3 - Full width for 辞退 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">4. 辞退</h3>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                      {applications.filter(app => app.status === '辞退').length}件
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {applications.filter(app => app.status === '辞退').map((app) => (
                    <div key={app.id} onClick={() => setSelectedApp(app)} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.from_id} | {new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{app.phone}</div>
                          <div className="text-xs text-gray-500">{app.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {applications.filter(app => app.status === '辞退').length === 0 && (
                    <div className="text-center py-8 text-gray-500">辞退のデータがありません</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">応募詳細</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">応募日時</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedApp.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">案件ID</label>
                    <p className="text-sm text-gray-900">{selectedApp.from_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
                    <p className="text-sm text-gray-900">{selectedApp.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ふりがな</label>
                    <p className="text-sm text-gray-900">{selectedApp.kana}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                    <p className="text-sm text-gray-900">{selectedApp.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                    <p className="text-sm text-gray-900">{selectedApp.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">現住所</label>
                  <p className="text-sm text-gray-900">{selectedApp.address}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">職歴</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApp.work_history}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">希望条件</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApp.desired_conditions}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => {
                      updateStatus(selectedApp.id, e.target.value)
                      setSelectedApp({ ...selectedApp, status: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                  <select
                    value={selectedApp.person_in_charge || ''}
                    onChange={(e) => {
                      const updatedApp = { ...selectedApp, person_in_charge: e.target.value }
                      setSelectedApp(updatedApp)
                      updatePersonInCharge(selectedApp.id, e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                  >
                    <option value="">未設定</option>
                    {PERSON_IN_CHARGE_OPTIONS.map(person => (
                      <option key={person} value={person}>{person}</option>
                    ))}
                  </select>
                </div>

                {/* Interview Schedule Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-teal-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">面接スケジュール</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">面接日</label>
                      <input
                        type="date"
                        value={selectedApp.interview_date || ''}
                        onChange={(e) => {
                          const updatedApp = { ...selectedApp, interview_date: e.target.value }
                          setSelectedApp(updatedApp)
                          updateInterviewSchedule(selectedApp.id, {
                            interview_date: e.target.value,
                            interview_time: selectedApp.interview_time,
                            interview_location: selectedApp.interview_location,
                            interview_notes: selectedApp.interview_notes
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">面接時刻</label>
                      <input
                        type="time"
                        value={selectedApp.interview_time || ''}
                        onChange={(e) => {
                          const updatedApp = { ...selectedApp, interview_time: e.target.value }
                          setSelectedApp(updatedApp)
                          updateInterviewSchedule(selectedApp.id, {
                            interview_date: selectedApp.interview_date,
                            interview_time: e.target.value,
                            interview_location: selectedApp.interview_location,
                            interview_notes: selectedApp.interview_notes
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">面接場所</label>
                    <input
                      type="text"
                      value={selectedApp.interview_location || ''}
                      onChange={(e) => {
                        const updatedApp = { ...selectedApp, interview_location: e.target.value }
                        setSelectedApp(updatedApp)
                        updateInterviewSchedule(selectedApp.id, {
                          interview_date: selectedApp.interview_date,
                          interview_time: selectedApp.interview_time,
                          interview_location: e.target.value,
                          interview_notes: selectedApp.interview_notes
                        })
                      }}
                      placeholder="例: 本社会議室A、Zoomミーティングなど"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">面接メモ</label>
                    <textarea
                      value={selectedApp.interview_notes || ''}
                      onChange={(e) => {
                        const updatedApp = { ...selectedApp, interview_notes: e.target.value }
                        setSelectedApp(updatedApp)
                        updateInterviewSchedule(selectedApp.id, {
                          interview_date: selectedApp.interview_date,
                          interview_time: selectedApp.interview_time,
                          interview_location: selectedApp.interview_location,
                          interview_notes: e.target.value
                        })
                      }}
                      rows={3}
                      placeholder="面接に関するメモや注意事項を入力してください"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                    />
                  </div>

                  {selectedApp.interview_date && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-teal-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                          <p className="font-medium text-teal-900">面接情報</p>
                          <p className="text-teal-700 mt-1">
                            {new Date(selectedApp.interview_date).toLocaleDateString('ja-JP', {
                              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                            })}
                            {selectedApp.interview_time && ` ${selectedApp.interview_time}`}
                          </p>
                          {selectedApp.interview_location && (
                            <p className="text-teal-700 mt-1">場所: {selectedApp.interview_location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
    <Sidebar>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }>
        <AdminPageContent />
      </Suspense>
    </Sidebar>
  )
}