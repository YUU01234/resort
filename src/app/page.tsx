import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            リゾートバイト応募システム
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            素敵なリゾートでのお仕事を始めませんか？
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 応募者用 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                応募者の方
              </h2>
              <p className="text-gray-600 mb-6">
                リゾートバイトへの応募はこちらから
              </p>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>案件IDをURLに含めて応募フォームにアクセス</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>必要情報を入力して簡単応募</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>3営業日以内にご連絡</span>
              </div>
            </div>
            
            <Link
              href="/apply"
              className="block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              応募フォームへ
            </Link>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                例: /apply?from_id=RESORT001
              </p>
            </div>
          </div>

          {/* 管理者用 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                管理者の方
              </h2>
              <p className="text-gray-600 mb-6">
                応募データの管理はこちらから
              </p>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700 mb-6">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>応募者一覧の確認・管理</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>ステータス管理・フィルタリング</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>CSVダウンロード機能</span>
              </div>
            </div>
            
            <Link
              href="/admin"
              className="block w-full bg-green-600 text-white text-center py-3 px-6 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              管理画面へ
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              システム概要
            </h3>
            <p className="text-sm text-gray-700">
              このシステムは、リゾートバイトの応募受付と管理を効率化するためのWebアプリケーションです。<br />
              応募者は簡単なフォームから応募でき、管理者は応募データを一元管理できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
