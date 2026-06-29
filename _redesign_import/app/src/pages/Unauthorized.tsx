import { Link } from 'react-router'
import { ShieldAlert, ArrowRight } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-warka-bg font-arabic flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-warka-text mb-3">غير مصرح</h1>
        <p className="text-warka-text-secondary mb-6 leading-relaxed">
          ليس لديك صلاحية الوصول إلى هذه الصفحة. يرجى التواصل مع المدير إذا كنت تعتقد أن هذا خطأ.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors"
        >
          العودة للرئيسية
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
