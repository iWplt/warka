import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff, Check, Shield } from 'lucide-react'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function Setup() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useStore()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة')
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    login({
      id: 1,
      name: form.name || 'المدير',
      email: form.email,
      role: 'admin',
    })

    toast.success('تم إعداد حساب المدير بنجاح!')
    navigate('/admin')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <img src="/warka-logo.png" alt="WARKA" className="h-16 w-16" />
            <span className="font-display text-2xl font-bold text-warka-text">WARKA</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warka-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-warka-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-warka-text">الإعداد الأولي</h1>
              <p className="text-xs text-warka-text-secondary">إنشاء حساب المدير الرئيسي</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-warka-text mb-1.5">الاسم</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم المدير"
                className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warka-text mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warka-text mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary pl-12"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-warka-text-muted"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-warka-text mb-1.5">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  إنشاء الحساب
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
