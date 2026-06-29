import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  MapPin,
  UserCircle,
  Users,
  Package,
  Printer,
  Truck,
  CreditCard,
  Settings,
  BarChart3,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Palette,
  FileText,
} from 'lucide-react'
import { useStore } from '@/lib/store'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface PortalSidebarProps {
  portal: 'student' | 'representative' | 'employee' | 'admin'
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const navItems: Record<string, NavItem[]> = {
  student: [
    { label: 'لوحة التحكم', href: '/student', icon: LayoutDashboard },
    { label: 'طلب جديد', href: '/student/orders/new', icon: ShoppingBag },
    { label: 'طلباتي', href: '/student/orders', icon: ClipboardList },
    { label: 'متابعة الطلب', href: '/student/tracking', icon: MapPin },
    { label: 'الملف الشخصي', href: '/student/profile', icon: UserCircle },
  ],
  representative: [
    { label: 'لوحة التحكم', href: '/representative', icon: LayoutDashboard },
    { label: 'دفعاتي', href: '/representative/batches', icon: Users },
    { label: 'الطلبات', href: '/representative/orders', icon: ClipboardList },
    { label: 'متابعة الدفعة', href: '/representative/tracking', icon: MapPin },
  ],
  employee: [
    { label: 'لوحة التحكم', href: '/employee', icon: LayoutDashboard },
    { label: 'الطلبات', href: '/employee/orders', icon: ClipboardList },
    { label: 'الطباعة', href: '/employee/printing', icon: Printer },
  ],
  admin: [
    { label: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
    { label: 'الطلبات', href: '/admin/orders', icon: ClipboardList },
    { label: 'التصميم', href: '/admin/design', icon: Palette },
    { label: 'القوالب', href: '/admin/templates', icon: FileText },
    { label: 'الطباعة', href: '/admin/printing', icon: Printer },
    { label: 'التسليم', href: '/admin/delivery', icon: Truck },
    { label: 'المدفوعات', href: '/admin/payments', icon: CreditCard },
    { label: 'المستخدمون', href: '/admin/users', icon: Users },
    { label: 'الدفعات', href: '/admin/batches', icon: Package },
    { label: 'التقارير', href: '/admin/reports', icon: BarChart3 },
    { label: 'الإعدادات', href: '/admin/settings', icon: Settings },
  ],
}

const portalTitles: Record<string, { title: string; subtitle: string }> = {
  student: { title: 'WARKA', subtitle: 'بوابة الطالب' },
  representative: { title: 'WARKA', subtitle: 'بوابة الممثل' },
  employee: { title: 'WARKA', subtitle: 'بوابة الموظف' },
  admin: { title: 'WARKA', subtitle: 'لوحة المدير' },
}

export default function PortalSidebar({ portal, collapsed = false, onToggleCollapse }: PortalSidebarProps) {
  const location = useLocation()
  const { logout, user, unreadNotifications } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = navItems[portal] || []
  const { title, subtitle } = portalTitles[portal]

  const isActive = (href: string) => {
    if (href === `/${portal}`) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <Link to={`/${portal}`} className="flex items-center gap-3">
          <img src="/warka-logo.png" alt="WARKA" className="h-10 w-10" />
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-display text-lg font-bold text-white leading-tight">{title}</div>
              <div className="text-[10px] text-white/60 leading-tight">{subtitle}</div>
            </div>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-hide">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-white/10 text-white border-r-2 border-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors relative">
          <Bell className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">الإشعارات</span>}
          {unreadNotifications > 0 && (
            <span className={`absolute top-2 ${collapsed ? 'left-2' : 'left-8'} h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>
              {unreadNotifications}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            logout()
            window.location.href = '/'
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-red-400 hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">تسجيل الخروج</span>}
        </button>

        {/* User */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-warka-primary-light flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/50 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden w-10 h-10 bg-warka-primary rounded-xl flex items-center justify-center text-white shadow-lg"
      >
        {mobileOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-warka-sidebar z-40 flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 right-0 h-full bg-warka-sidebar z-30 flex-col transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="absolute -left-3 top-20 w-6 h-6 bg-warka-sidebar border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </aside>
    </>
  )
}
