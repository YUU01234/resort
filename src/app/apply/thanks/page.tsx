import Link from 'next/link'

export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              応募完了
            </h1>
            <p className="text-gray-600">
              ありがとうございます！
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            <p className="text-sm text-gray-700">
              応募を受け付けました。担当者より3営業日以内にご連絡いたします。
            </p>
            <p className="text-sm text-gray-700">
              お急ぎの場合は、お電話でもお気軽にお問い合わせください。
            </p>
          </div>
          
          <div className="mt-8">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}