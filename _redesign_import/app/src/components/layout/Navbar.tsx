import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, ShoppingCart, User, Menu, X, LogOut } from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, isAuthenticated, logout, cartCount } = useStore()
  const navigate = useNavigate()

  const navLinks = [
    { href: '/#home', label: 'الرئيسية' },
    { href: '/#products', label: 'منتجاتنا' },
    { href: '/#how-it-works', label: 'كيف يعمل' },
    { href: '/#contact', label: 'تواصل' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'admin': return '/admin'
      case 'employee': return '/employee'
      case 'representative': return '/representative'
      case 'student': return '/student'
      default: return '/student'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-warka-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Right: Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/warka-logo.png" alt="WARKA" className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold text-warka-text tracking-wide">WARKA</span>
              <span className="text-[10px] text-warka-text-muted -mt-1">متجر طباعة التخرج</span>
            </div>
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-warka-text-secondary hover:text-warka-text transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Left: Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-warka-text-secondary hover:text-warka-text hover:bg-warka-bg rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart */}
            <Link
              to={isAuthenticated ? '/student/orders/new' : '/login'}
              className="relative p-2 text-warka-text-secondary hover:text-warka-text hover:bg-warka-bg rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount()}
                </span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-warka-text-secondary hover:text-warka-text hover:bg-warka-bg rounded-lg transition-colors">
                    <User className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-arabic">
                  <div className="px-3 py-2 text-sm font-medium text-warka-text border-b border-warka-border">
                    {user?.name}
                  </div>
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                    <User className="ml-2 h-4 w-4" />
                    لوحة التحكم
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="ml-2 h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-warka-primary text-white text-sm font-medium rounded-lg hover:bg-warka-primary-dark transition-colors"
              >
                تسجيل الدخول
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-warka-text-secondary hover:text-warka-text hover:bg-warka-bg rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="pb-3 animate-fade-in">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warka-text-muted" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                className="w-full pr-10 pl-4 py-2.5 bg-warka-bg border border-warka-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-warka-border bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-warka-text-secondary hover:text-warka-text hover:bg-warka-bg rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-warka-primary hover:bg-warka-bg rounded-lg transition-colors"
              >
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
