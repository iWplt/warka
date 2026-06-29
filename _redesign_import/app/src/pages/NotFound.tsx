import { Link } from 'react-router'
import { Home, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-warka-bg font-arabic flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <img src="/warka-logo.png" alt="WARKA" className="h-16 w-16 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-warka-text mb-4">404</h1>
        <h2 className="text-xl font-bold text-warka-text mb-2">الصفحة غير موجودة</h2>
        <p className="text-warka-text-secondary mb-8">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors"
        >
          <Home className="h-4 w-4" />
          العودة للرئيسية
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
