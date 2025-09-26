'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface AttendanceRecord {
  id: string
  staff_id: string
  staff_name: string
  date: string
  clock_in_time?: string
  clock_out_time?: string
  break_start_time?: string
  break_end_time?: string
  work_location?: string
  notes?: string
  status: 'clocked_in' | 'on_break' | 'clocked_out'
}

interface StaffInfo {
  id: string
  name: string
  employee_id: string
  department: string
  position: string
  hourlyRate: number
  savingsGoal: number
  currentSavings: number
}


export default function AttendancePage() {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<{
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
    time: string
    actualTime?: string
    index?: number
  } | null>(null)
  const [location, setLocation] = useState<{address: string, lat?: number, lng?: number} | null>(null)

  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null)

  // 田中太郎さんのID（DB上の実際のID）
  const STAFF_ID = '0d2af08d-85ef-4a6c-b506-740c3d61af2b'

  const loadTodayData = useCallback(async () => {
    if (!staffInfo) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('staff_id', STAFF_ID)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setTodayAttendance(data as AttendanceRecord)
      } else {
        setTodayAttendance(null)
      }
    } catch (error) {
      console.error('Error loading attendance data:', error)
      setTodayAttendance(null)
    }
  }, [staffInfo])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    getCurrentLocation()
    loadStaffInfo()

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (staffInfo) {
      loadTodayData()
    }
  }, [staffInfo, loadTodayData])

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          })
        })

        setLocation({
          address: `位置情報取得済み (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      } catch {
        setLocation({ address: '位置情報を取得できませんでした' })
      }
    } else {
      setLocation({ address: '位置情報がサポートされていません' })
    }
  }

  const loadStaffInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_master')
        .select('*')
        .eq('id', STAFF_ID)
        .single()

      if (error) throw error

      if (data) {
        setStaffInfo({
          ...data,
          hourlyRate: 1200,
          savingsGoal: 50000,
          currentSavings: 15000
        })
      }
    } catch (error) {
      console.error('Error loading staff info:', error)
    }
  }

  const calculateCurrentEarnings = () => {
    if (!todayAttendance?.clock_in_time || !staffInfo?.hourlyRate) return 0

    const clockInTime = new Date(todayAttendance.clock_in_time)
    const endTime = todayAttendance.clock_out_time
      ? new Date(todayAttendance.clock_out_time)
      : currentTime

    let workingMinutes = Math.max(0, (endTime.getTime() - clockInTime.getTime()) / (1000 * 60))

    // 休憩時間を差し引く
    if (todayAttendance.break_start_time && todayAttendance.break_end_time) {
      const breakStart = new Date(todayAttendance.break_start_time)
      const breakEnd = new Date(todayAttendance.break_end_time)
      workingMinutes -= (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
    } else if (todayAttendance.break_start_time && todayAttendance.status === 'on_break') {
      const breakStart = new Date(todayAttendance.break_start_time)
      workingMinutes -= (currentTime.getTime() - breakStart.getTime()) / (1000 * 60)
    }

    const workingHours = Math.max(0, workingMinutes / 60)
    return Math.floor(workingHours * staffInfo.hourlyRate)
  }

  const getWorkingTime = () => {
    if (!todayAttendance?.clock_in_time) return '0時間0分'

    const clockInTime = new Date(todayAttendance.clock_in_time)
    const endTime = todayAttendance.clock_out_time
      ? new Date(todayAttendance.clock_out_time)
      : currentTime

    let workingMinutes = Math.max(0, (endTime.getTime() - clockInTime.getTime()) / (1000 * 60))

    // 休憩時間を差し引く
    if (todayAttendance.break_start_time && todayAttendance.break_end_time) {
      const breakStart = new Date(todayAttendance.break_start_time)
      const breakEnd = new Date(todayAttendance.break_end_time)
      workingMinutes -= (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
    } else if (todayAttendance.break_start_time && todayAttendance.status === 'on_break') {
      const breakStart = new Date(todayAttendance.break_start_time)
      workingMinutes -= (currentTime.getTime() - breakStart.getTime()) / (1000 * 60)
    }

    const hours = Math.floor(workingMinutes / 60)
    const minutes = Math.floor(workingMinutes % 60)
    return `${hours}時間${minutes}分`
  }

  const handleClockAction = async (actionType: 'clock_in' | 'clock_out' | 'start_break' | 'end_break') => {
    if (!staffInfo) return

    setIsSubmitting(true)

    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      switch (actionType) {
        case 'clock_in':
          const { data: insertData, error: insertError } = await supabase
            .from('attendances')
            .insert({
              staff_id: STAFF_ID,
              staff_name: staffInfo?.name || '',
              date: today,
              clock_in_time: now.toISOString(),
              status: 'clocked_in',
              work_location: staffInfo?.department || ''
            })
            .select()
            .single()

          if (insertError) throw insertError

          setTodayAttendance(insertData as AttendanceRecord)
          setSuccessMessage(`${staffInfo?.name || 'スタッフ'}さん、本日もよろしくお願いします！`)
          break

        case 'clock_out':
          if (!todayAttendance) return

          const { data: updateData, error: updateError } = await supabase
            .from('attendances')
            .update({
              clock_out_time: now.toISOString(),
              status: 'clocked_out'
            })
            .eq('id', todayAttendance.id)
            .select()
            .single()

          if (updateError) throw updateError

          setTodayAttendance(updateData as AttendanceRecord)
          setSuccessMessage('お疲れ様でした！退勤を記録しました。')
          break

        case 'start_break':
          if (!todayAttendance) return

          const { data: breakStartData, error: breakStartError } = await supabase
            .from('attendances')
            .update({
              break_start_time: now.toISOString(),
              status: 'on_break'
            })
            .eq('id', todayAttendance.id)
            .select()
            .single()

          if (breakStartError) throw breakStartError

          setTodayAttendance(breakStartData as AttendanceRecord)
          setSuccessMessage('休憩を開始しました。')
          break

        case 'end_break':
          if (!todayAttendance) return

          const { data: breakEndData, error: breakEndError } = await supabase
            .from('attendances')
            .update({
              break_end_time: now.toISOString(),
              status: 'clocked_in'
            })
            .eq('id', todayAttendance.id)
            .select()
            .single()

          if (breakEndError) throw breakEndError

          setTodayAttendance(breakEndData as AttendanceRecord)
          setSuccessMessage('休憩を終了しました。')
          break
      }

      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      alert('記録中にエラーが発生しました。もう一度お試しください。')
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTime = (type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end') => {
    let actualTime: string | undefined

    switch (type) {
      case 'clock_in':
        actualTime = todayAttendance?.clock_in_time ? new Date(todayAttendance.clock_in_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined
        break
      case 'clock_out':
        actualTime = todayAttendance?.clock_out_time ? new Date(todayAttendance.clock_out_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined
        break
      case 'break_start':
        actualTime = todayAttendance?.break_start_time ? new Date(todayAttendance.break_start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined
        break
      case 'break_end':
        actualTime = todayAttendance?.break_end_time ? new Date(todayAttendance.break_end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined
        break
    }

    setEditingRecord({
      type,
      time: actualTime || currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }),
      actualTime: actualTime
    })
    setShowEditModal(true)
  }

  const saveEditedTime = async () => {
    if (!editingRecord || !todayAttendance) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const [hours, minutes] = editingRecord.time.split(':')
      const newDateTime = new Date(`${today}T${hours}:${minutes}:00.000Z`)

      const updateData: Partial<AttendanceRecord> = {}
      switch (editingRecord.type) {
        case 'clock_in':
          updateData.clock_in_time = newDateTime.toISOString()
          break
        case 'clock_out':
          updateData.clock_out_time = newDateTime.toISOString()
          break
        case 'break_start':
          updateData.break_start_time = newDateTime.toISOString()
          break
        case 'break_end':
          updateData.break_end_time = newDateTime.toISOString()
          break
      }

      const { data, error } = await supabase
        .from('attendances')
        .update(updateData)
        .eq('id', todayAttendance.id)
        .select()
        .single()

      if (error) throw error

      setTodayAttendance(data as AttendanceRecord)
      setShowEditModal(false)
      setEditingRecord(null)
      setSuccessMessage('打刻時間を更新しました。')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      alert('時間の更新中にエラーが発生しました。')
      console.error('Error:', error)
    }
  }

  const isOnBreak = todayAttendance?.status === 'on_break'
  const canStartBreak = todayAttendance?.status === 'clocked_in'
  const canEndBreak = isOnBreak
  const canClockOut = todayAttendance?.status === 'clocked_in'
  const canClockIn = !todayAttendance || todayAttendance?.status === 'clocked_out'
  const currentEarnings = calculateCurrentEarnings()
  const totalSavings = (staffInfo?.currentSavings || 0) + currentEarnings
  const progressPercentage = Math.min(100, (totalSavings / (staffInfo?.savingsGoal || 1)) * 100)

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
          {successMessage && (
            <div className="bg-teal-100 border border-teal-200 text-teal-800 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">勤怠入力</h1>
            <p className="text-gray-600">勤務時間の記録と管理</p>
          </div>

          {/* リアルタイム時計 */}
          <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
            <div className="text-5xl font-mono font-bold text-gray-900 mb-3">
              {currentTime.toLocaleTimeString('ja-JP')}
            </div>
            <div className="text-lg text-gray-600 font-medium">
              {currentTime.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>

          {/* スタッフ情報カード */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-medium text-gray-900">スタッフ情報</h2>
            </div>

            {staffInfo && (
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">名前</div>
                  <div className="text-lg font-medium text-gray-900">{staffInfo.name}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">部署</div>
                  <div className="text-base font-medium text-gray-900">{staffInfo.department}</div>
                </div>

                <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg">
                  <div className="text-sm text-teal-600 mb-1">時給</div>
                  <div className="text-xl font-semibold text-teal-700">¥{staffInfo.hourlyRate.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* 貯金目標への道のり */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1a1 1 0 001 1h.01a1 1 0 100-2H3v-.5A.5.5 0 013.5 4h13a.5.5 0 01.5.5V6h-.01a1 1 0 100 2H17a1 1 0 001-1V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M11.097 1.515a.75.75 0 01.589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 111.47.294L16.665 7.5h3.085a.75.75 0 010 1.5h-3.416l-.91 4.55a.75.75 0 11-1.47-.294L14.835 9H10.09l-.91 4.55a.75.75 0 11-1.47-.294L8.665 9H5.25a.75.75 0 010-1.5h3.746l.91-4.55a.75.75 0 01.882-.585l.058-.01a.75.75 0 01.251.16z" clipRule="evenodd" />
                  </svg>
                  <span className="text-base font-medium text-gray-900">貯金目標への道のり</span>
                </div>
                <span className="text-sm text-gray-500">{progressPercentage.toFixed(1)}%</span>
              </div>

              {/* プログレスバー */}
              <div className="relative mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>¥0</span>
                  <span>¥{staffInfo?.savingsGoal?.toLocaleString() || '0'}</span>
                </div>

                <div className="relative">
                  {/* 道のり背景 */}
                  <div className="w-full h-8 bg-gray-100 rounded-full border-2 border-gray-200 overflow-hidden">
                    {/* プログレス */}
                    <div
                      className="h-full bg-teal-400 transition-all duration-700 ease-out relative"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-teal-500 opacity-20"></div>
                    </div>

                    {/* マイルストーンマーカー */}
                    <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gray-300"></div>
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300"></div>
                    <div className="absolute top-0 left-3/4 w-0.5 h-full bg-gray-300"></div>
                  </div>

                  {/* 歩いている人のアイコン */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
                    style={{ left: `${Math.min(95, Math.max(5, progressPercentage))}%` }}
                  >
                    <div className="w-6 h-6 bg-white border-2 border-teal-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* ゴールフラグ */}
                  <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
                    <div className="w-6 h-6 bg-white border-2 border-gray-400 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* マイルストーンアイコン */}
                  {[25, 50, 75].map((milestone) => (
                    <div
                      key={milestone}
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${milestone}%` }}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        progressPercentage >= milestone
                          ? 'bg-teal-100 border-teal-400'
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className={`w-full h-full rounded-full ${
                          progressPercentage >= milestone ? 'bg-teal-400' : 'bg-gray-200'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-gray-500">現在の貯金</div>
                  <div className="font-semibold text-gray-900">¥{totalSavings.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">目標額</div>
                  <div className="font-semibold text-gray-900">¥{staffInfo?.savingsGoal?.toLocaleString() || '0'}</div>
                </div>
              </div>

              {currentEarnings > 0 && (
                <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="text-xs text-teal-600 mb-1">今日の収入</div>
                  <div className="text-lg font-semibold text-teal-700">+¥{currentEarnings.toLocaleString()}</div>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                {progressPercentage >= 100 ? (
                  <span className="text-green-600 font-medium">目標達成！おめでとうございます！</span>
                ) : progressPercentage >= 80 ? (
                  <span className="text-orange-600 font-medium">ゴールまであと少し！頑張って！</span>
                ) : progressPercentage >= 50 ? (
                  <span className="text-blue-600 font-medium">半分達成！いい調子です！</span>
                ) : (
                  <span className="text-gray-600">コツコツ頑張りましょう！</span>
                )}
              </div>
            </div>
          </div>

          {/* 収入ダッシュボード */}
          {todayAttendance?.clock_in_time && (
            <div className="bg-white border border-teal-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-teal-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1a1 1 0 001 1h.01a1 1 0 100-2H3v-.5A.5.5 0 013.5 4h13a.5.5 0 01.5.5V6h-.01a1 1 0 100 2H17a1 1 0 001-1V6a2 2 0 00-2-2H4z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">本日の収入</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">¥{currentEarnings.toLocaleString()}</div>
                <div className="text-sm text-gray-600">稼働時間: {getWorkingTime()}</div>
                {todayAttendance?.status === 'clocked_in' && (
                  <div className="text-xs text-teal-600 mt-2">勤務中</div>
                )}
              </div>
            </div>
          )}

          {/* 打刻ボタン */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-medium text-gray-900">打刻</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleClockAction('clock_in')}
                disabled={!canClockIn || isSubmitting}
                className={`w-full p-4 rounded-lg text-white font-medium min-h-[60px] flex items-center justify-center ${
                  !canClockIn || isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    出勤
                  </div>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleClockAction('start_break')}
                  disabled={!canStartBreak || isSubmitting}
                  className={`w-full p-4 rounded-lg text-white font-medium min-h-[60px] flex items-center justify-center ${
                    !canStartBreak || isSubmitting
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">休憩開始</span>
                  </div>
                </button>

                <button
                  onClick={() => handleClockAction('end_break')}
                  disabled={!canEndBreak || isSubmitting}
                  className={`w-full p-4 rounded-lg text-white font-medium min-h-[60px] flex items-center justify-center ${
                    !canEndBreak || isSubmitting
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">休憩終了</span>
                  </div>
                </button>
              </div>

              <button
                onClick={() => handleClockAction('clock_out')}
                disabled={!canClockOut || isSubmitting}
                className={`w-full p-4 rounded-lg text-white font-medium min-h-[60px] flex items-center justify-center ${
                  !canClockOut || isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  退勤
                </div>
              </button>
            </div>
          </div>

          {/* 本日の打刻状況 */}
          {todayAttendance && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">本日の打刻状況</h3>
              </div>

              <div className="space-y-3">
                {/* 出勤 */}
                <div className={`flex justify-between items-center p-4 rounded-lg border ${
                  todayAttendance.clock_in_time ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className="font-medium text-gray-900">出勤</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">
                        {todayAttendance.clock_in_time
                          ? new Date(todayAttendance.clock_in_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })
                          : '未打刻'
                        }
                      </div>
                    </div>
                    {todayAttendance.clock_in_time && (
                      <button
                        onClick={() => handleEditTime('clock_in')}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
                      >
                        編集
                      </button>
                    )}
                  </div>
                </div>

                {/* 休憩履歴 */}
                {todayAttendance.break_start_time && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <span className="font-medium text-gray-900">休憩開始</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {new Date(todayAttendance.break_start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        <button
                          onClick={() => handleEditTime('break_start')}
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
                        >
                          編集
                        </button>
                      </div>
                    </div>

                    {todayAttendance.break_end_time && (
                      <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <span className="font-medium text-gray-900">休憩終了</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {new Date(todayAttendance.break_end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                          <button
                            onClick={() => handleEditTime('break_end')}
                            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
                          >
                            編集
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 退勤 */}
                <div className={`flex justify-between items-center p-4 rounded-lg border ${
                  todayAttendance.clock_out_time ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className="font-medium text-gray-900">退勤</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">
                        {todayAttendance.clock_out_time
                          ? new Date(todayAttendance.clock_out_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })
                          : '未打刻'
                        }
                      </div>
                    </div>
                    {todayAttendance.clock_out_time && (
                      <button
                        onClick={() => handleEditTime('clock_out')}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
                      >
                        編集
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 位置情報 */}
          {location && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-base font-medium text-gray-900">現在地</h3>
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                {location.address}
              </div>
            </div>
          )}
        </div>

        {/* 時刻編集モーダル */}
        {showEditModal && editingRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-4 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">時刻編集</h3>

              {editingRecord.actualTime && (
                <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600 border">
                  <div className="font-medium mb-1">実打刻時間: {editingRecord.actualTime}</div>
                  {editingRecord.type === 'clock_in' && <div>※ 実打刻時間以降の時刻に設定してください</div>}
                  {editingRecord.type === 'clock_out' && <div>※ 実打刻時間以前の時刻に設定してください</div>}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">新しい時刻</label>
                <input
                  type="time"
                  value={editingRecord.time}
                  onChange={(e) => setEditingRecord({...editingRecord, time: e.target.value})}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveEditedTime}
                  className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  )
}