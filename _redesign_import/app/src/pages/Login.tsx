import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'

type UserRole = 'admin' | 'employee' | 'representative' | 'student'

interface DemoAccount {
  email: string
  password: string
  role: UserRole
  name: string
}

const demoAccounts: DemoAccount[] = [
  { email: 'admin@printshop.com', password: 'Admin@123', role: 'admin', name: 'المدير' },
  { email: 'rep@printshop.com', password: 'Rep@123', role: 'representative', name: 'الممثل' },
  { email: 'ahmed@student.com', password: 'Student@123', role: 'student', name: 'أحمد الطالب' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 800))

    const account = demoAccounts.find(
      (a) => a.email === email && a.password === password
    )

    if (account) {
      login({
        id: 1,
        name: account.name,
        email: account.email,
        role: account.role,
      })
      toast.success(`مرحباً ${account.name}!`)

      // Redirect based on role
      switch (account.role) {
        case 'admin':
          navigate('/admin')
          break
        case 'employee':
          navigate('/employee')
          break
        case 'representative':
          navigate('/representative')
          break
        case 'student':
          navigate('/student')
          break
        default:
          navigate('/student')
      }
    } else {
      toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    }

    setLoading(false)
  }

  const fillDemo = (account: DemoAccount) => {
    setEmail(account.email)
    setPassword(account.password)
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <img src="/warka-logo.png" alt="WARKA" className="h-16 w-16" />
            <div>
              <span className="font-display text-2xl font-bold text-warka-text tracking-wide">WARKA</span>
              <p className="text-xs text-warka-text-muted mt-1">متجر طباعة التخرج</p>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-warka-text mb-1 text-center">تسجيل الدخول</h1>
          <p className="text-sm text-warka-text-secondary text-center mb-6">أدخل بياناتك للوصول إلى حسابك</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-warka-text mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary transition-all"
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warka-text mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary transition-all pl-12"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-warka-text-muted hover:text-warka-text"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-warka-border text-warka-primary focus:ring-warka-primary" />
                <span className="text-xs text-warka-text-secondary">تذكرني</span>
              </label>
              <button type="button" className="text-xs text-warka-primary hover:underline">
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/register"
              className="text-sm text-warka-primary hover:underline inline-flex items-center gap-1"
            >
              ليس لديك حساب؟ سجل الآن
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-warka-border">
            <p className="text-xs text-warka-text-muted text-center mb-3">حسابات تجريبية للاختبار</p>
            <div className="space-y-2">
              {demoAccounts.map((account, i) => (
                <button
                  key={i}
                  onClick={() => fillDemo(account)}
                  className="w-full px-3 py-2 bg-warka-bg rounded-lg text-xs text-warka-text-secondary hover:bg-warka-bg-dark hover:text-warka-text transition-colors text-right"
                >
                  <span className="font-medium">{account.name}</span>
                  <span className="text-warka-text-muted mr-2" dir="ltr">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-warka-text-muted hover:text-warka-text transition-colors">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
