'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  children: React.ReactNode
}

const menuItems = [
  {
    name: 'ホーム',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    )
  },
  {
    name: '応募フォーム',
    href: '/apply',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    name: '勤怠入力',
    href: '/attendance',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    name: '稼働管理',
    href: '/staff-management',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    )
  },
  {
    name: '応募管理',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
      </svg>
    )
  }
]

export default function Sidebar({ children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky lg:top-0 h-screen bg-white border-r border-gray-200 shadow-sm z-50
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900">リゾート管理</span>
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-teal-100 text-teal-700 border-r-2 border-teal-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                >
                  <span className={`${isActive(item.href) ? 'text-teal-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="ml-3 transition-opacity duration-200">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">管理者</p>
                <p>v1.0.0</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">リゾート管理</span>
          </div>

          <div className="w-9 h-9" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}