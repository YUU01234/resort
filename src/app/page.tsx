import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

export default function Home() {
  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            リゾート管理システム
          </h1>
          <p className="text-gray-600">
            アカウント種別を選択してください
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Applicant Card */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 card-hover">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">応募者</h2>
              <p className="text-sm text-gray-600">リゾートバイトへの応募</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                案件IDで簡単アクセス
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                3営業日以内にご連絡
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                必要情報入力のみ
              </div>
            </div>

            <Link
              href="/apply"
              className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              応募フォームへ
            </Link>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                例: /apply?from_id=RESORT001
              </p>
            </div>
          </div>

          {/* Staff Attendance Card */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 card-hover">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">スタッフ</h2>
              <p className="text-sm text-gray-600">勤怠入力</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                簡単出退勤打刻
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                休憩時間管理
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                スマホ対応 UI
              </div>
            </div>

            <Link
              href="/attendance"
              className="block w-full bg-teal-400 text-white text-center py-3 px-4 rounded-md hover:bg-teal-500 transition-colors font-medium"
            >
              勤怠入力へ
            </Link>
          </div>

          {/* Staff Management Card */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 card-hover">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">管理者</h2>
              <p className="text-sm text-gray-600">稼働管理</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
                リアルタイム稼働状況
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2zm0 4.5h16l-.811 7.71a2 2 0 01-1.99 1.79H4.802a2 2 0 01-1.99-1.79L2 7.5zM10 9a.75.75 0 01.75.75v2.546l.943-1.048a.75.75 0 111.014 1.104l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.014-1.104L9.25 12.296V9.75A.75.75 0 0110 9z" clipRule="evenodd" />
                </svg>
                統計ダッシュボード
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                CSVエクスポート
              </div>
            </div>

            <Link
              href="/staff-management"
              className="block w-full bg-purple-600 text-white text-center py-3 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              稼働管理へ
            </Link>
          </div>

          {/* Admin Card */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 card-hover">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">管理者</h2>
              <p className="text-sm text-gray-600">応募管理</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                応募者一覧の確認・管理
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v3a1 1 0 01-.293.707L19 12.414l-2.293 2.293A1 1 0 0116 15v3a1 1 0 01-1 1H9a1 1 0 01-1-1v-3a1 1 0 01.293-.707L10 12.414 7.293 9.707A1 1 0 017 9V6a1 1 0 011-1h3z" />
                </svg>
                面接スケジュール
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSVダウンロード
              </div>
            </div>

            <Link
              href="/admin"
              className="block w-full bg-gray-900 text-white text-center py-3 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              応募管理へ
            </Link>
          </div>
        </div>
      </div>
      </div>
    </Sidebar>
  )
}
