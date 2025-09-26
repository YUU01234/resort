'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { supabase, Staff, Attendance } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface AttendanceWithStaff extends Attendance {
  staff: Staff
}

interface DashboardStats {
  totalStaff: number
  clockedInStaff: number
  onBreakStaff: number
  clockedOutStaff: number
  totalWorkingHours: number
}

function StaffManagementContent() {
  const [attendances, setAttendances] = useState<AttendanceWithStaff[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    clockedInStaff: 0,
    onBreakStaff: 0,
    clockedOutStaff: 0,
    totalWorkingHours: 0
  })
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [departmentFilter, setDepartmentFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const departments = ['フロント', 'レストラン', 'ハウスキーピング', 'メンテナンス', '管理事務所']

  const calculateStats = useCallback((attendances: AttendanceWithStaff[]) => {
    const todayAttendances = attendances.filter(att => att.date === selectedDate)
    const uniqueStaff = new Set(todayAttendances.map(att => att.staff_id))

    const clockedInCount = todayAttendances.filter(att => att.status === 'clocked_in').length
    const onBreakCount = todayAttendances.filter(att => att.status === 'on_break').length
    const clockedOutCount = todayAttendances.filter(att => att.status === 'clocked_out').length

    // Calculate total working hours
    let totalHours = 0
    todayAttendances.forEach(att => {
      if (att.clock_in_time && att.clock_out_time) {
        const clockIn = new Date(att.clock_in_time)
        const clockOut = new Date(att.clock_out_time)
        const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

        // Subtract break time if available
        if (att.break_start_time && att.break_end_time) {
          const breakStart = new Date(att.break_start_time)
          const breakEnd = new Date(att.break_end_time)
          const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60)
          totalHours += Math.max(0, hours - breakHours)
        } else {
          totalHours += hours
        }
      }
    })

    setStats({
      totalStaff: uniqueStaff.size,
      clockedInStaff: clockedInCount,
      onBreakStaff: onBreakCount,
      clockedOutStaff: clockedOutCount,
      totalWorkingHours: totalHours
    })
  }, [selectedDate])

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('attendances')
        .select(`
          *,
          staff:staff_master(*)
        `)
        .order('created_at', { ascending: false })

      // Date filtering based on view mode
      if (viewMode === 'today') {
        query = query.eq('date', selectedDate)
      } else if (viewMode === 'week') {
        const weekStart = new Date(selectedDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        query = query
          .gte('date', weekStart.toISOString().split('T')[0])
          .lte('date', weekEnd.toISOString().split('T')[0])
      } else if (viewMode === 'month') {
        const monthStart = selectedDate.substring(0, 7) + '-01'
        const monthEnd = new Date(selectedDate.substring(0, 7) + '-01')
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        monthEnd.setDate(monthEnd.getDate() - 1)

        query = query
          .gte('date', monthStart)
          .lte('date', monthEnd.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) throw error

      const attendancesWithStaff = (data || []).filter(item =>
        item.staff && (!departmentFilter || item.staff.department === departmentFilter)
      ) as AttendanceWithStaff[]

      setAttendances(attendancesWithStaff)
      calculateStats(attendancesWithStaff)
    } catch (error) {
      console.error('Error fetching attendances:', error)
    } finally {
      setLoading(false)
    }
    }, [selectedDate, viewMode, departmentFilter, calculateStats])

  useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            出勤中
          </span>
        )
      case 'on_break':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            休憩中
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            退勤済み
          </span>
        )
    }
  }

  const formatWorkingHours = (clockIn: string | null, clockOut: string | null, breakStart: string | null, breakEnd: string | null) => {
    if (!clockIn) return '-'

    const startTime = new Date(clockIn)
    if (!clockOut) {
      // Still working
      const now = new Date()
      const hours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      return `${hours.toFixed(1)}h (進行中)`
    }

    const endTime = new Date(clockOut)
    let totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    // Subtract break time if available
    if (breakStart && breakEnd) {
      const breakStartTime = new Date(breakStart)
      const breakEndTime = new Date(breakEnd)
      const breakHours = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60 * 60)
      totalHours = Math.max(0, totalHours - breakHours)
    }

    return `${totalHours.toFixed(1)}h`
  }

  const exportToCSV = () => {
    const headers = [
      '日付', 'スタッフ名', '部署', '出勤時刻', '退勤時刻',
      '休憩開始', '休憩終了', '勤務場所', '勤務時間', 'ステータス', 'メモ'
    ]

    const csvContent = [
      headers.join(','),
      ...attendances.map(att => [
        att.date,
        `"${att.staff_name}"`,
        `"${att.staff?.department || ''}"`,
        att.clock_in_time ? new Date(att.clock_in_time).toLocaleTimeString('ja-JP') : '',
        att.clock_out_time ? new Date(att.clock_out_time).toLocaleTimeString('ja-JP') : '',
        att.break_start_time ? new Date(att.break_start_time).toLocaleTimeString('ja-JP') : '',
        att.break_end_time ? new Date(att.break_end_time).toLocaleTimeString('ja-JP') : '',
        `"${att.work_location || ''}"`,
        formatWorkingHours(att.clock_in_time, att.clock_out_time, att.break_start_time, att.break_end_time),
        att.status === 'clocked_in' ? '出勤中' : att.status === 'on_break' ? '休憩中' : '退勤済み',
        `"${(att.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\r\n')

    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `staff_attendance_${selectedDate}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
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
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">稼働管理</h1>
                <p className="text-sm text-gray-600">スタッフの勤怠状況を管理</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-teal-400 text-white px-4 py-2 rounded-lg hover:bg-teal-500 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              CSVエクスポート
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('today')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'today'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                日別表示
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                週別表示
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'month'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                月別表示
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                >
                  <option value="">すべて</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">出勤スタッフ</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">勤務中</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.clockedInStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">休憩中</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.onBreakStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">退勤済み</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.clockedOutStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">総勤務時間</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalWorkingHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-teal-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">勤怠一覧</h3>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                {attendances.length}件
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">日付</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">スタッフ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">出勤時刻</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">退勤時刻</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">勤務時間</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">勤務場所</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ステータス</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {attendances.map((attendance, index) => (
                  <tr key={attendance.id} className={`hover:bg-teal-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(attendance.date).toLocaleDateString('ja-JP')}
                      </div>
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
                          <div className="text-sm font-medium text-gray-900">{attendance.staff_name}</div>
                          <div className="text-xs text-gray-500">{attendance.staff?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {attendance.clock_in_time
                          ? new Date(attendance.clock_in_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {attendance.clock_out_time
                          ? new Date(attendance.clock_out_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {formatWorkingHours(attendance.clock_in_time, attendance.clock_out_time, attendance.break_start_time, attendance.break_end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{attendance.work_location || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(attendance.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attendances.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">該当する勤怠データがありません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StaffManagementPage() {
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
        <StaffManagementContent />
      </Suspense>
    </Sidebar>
  )
}