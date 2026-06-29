import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff, ChevronLeft, ChevronRight, UserCheck, GraduationCap, Users, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function Register() {
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useStore()

  const [form, setForm] = useState({
    role: 'student',
    name: '',
    phone: '',
    email: '',
    college: '',
    department: '',
    graduationYear: '',
    password: '',
    confirmPassword: '',
  })

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (step === 1 && !form.role) {
      toast.error('اختر نوع الحساب')
      return
    }
    if (step === 2 && (!form.name || !form.phone || !form.email)) {
      toast.error('أكمل البيانات الشخصية')
      return
    }
    if (step === 3 && form.role === 'student' && (!form.college || !form.department)) {
      toast.error('أكمل البيانات الأكاديمية')
      return
    }
    if (step === 4 && (!form.password || form.password !== form.confirmPassword)) {
      toast.error('تأكد من كلمة المرور وتطابقها')
      return
    }
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    login({
      id: Date.now(),
      name: form.name,
      email: form.email,
      role: form.role as 'student' | 'representative' | 'employee' | 'admin',
    })

    toast.success('تم إنشاء الحساب بنجاح!')

    switch (form.role) {
      case 'admin': navigate('/admin'); break
      case 'representative': navigate('/representative'); break
      default: navigate('/student')
    }
    setLoading(false)
  }

  const steps = [
    { num: 1, label: 'نوع الحساب' },
    { num: 2, label: 'البيانات الشخصية' },
    { num: 3, label: 'البيانات الأكاديمية' },
    { num: 4, label: 'كلمة المرور' },
  ]

  return (
    <div className="min-h-screen bg-warka-bg font-arabic flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <img src="/warka-logo.png" alt="WARKA" className="h-12 w-12" />
            <span className="font-display text-xl font-bold text-warka-text">WARKA</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-warka-text mb-1 text-center">إنشاء حساب جديد</h1>
          <p className="text-sm text-warka-text-secondary text-center mb-6">أكمل الخطوات التالية للتسجيل</p>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 right-0 left-0 h-0.5 bg-warka-border -translate-y-1/2" />
            {steps.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s.num
                      ? 'bg-warka-primary text-white'
                      : 'bg-warka-bg text-warka-text-muted border border-warka-border'
                  }`}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-[10px] text-warka-text-muted hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Role */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm font-medium text-warka-text mb-4">اختر نوع الحساب</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => updateForm('role', 'student')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.role === 'student'
                      ? 'border-warka-primary bg-warka-primary/5'
                      : 'border-warka-border hover:border-warka-primary/50'
                  }`}
                >
                  <GraduationCap className={`h-8 w-8 mx-auto mb-2 ${form.role === 'student' ? 'text-warka-primary' : 'text-warka-text-muted'}`} />
                  <p className="text-sm font-semibold">طالب</p>
                </button>
                <button
                  onClick={() => updateForm('role', 'representative')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.role === 'representative'
                      ? 'border-warka-primary bg-warka-primary/5'
                      : 'border-warka-border hover:border-warka-primary/50'
                  }`}
                >
                  <Users className={`h-8 w-8 mx-auto mb-2 ${form.role === 'representative' ? 'text-warka-primary' : 'text-warka-text-muted'}`} />
                  <p className="text-sm font-semibold">ممثل دفعة</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-warka-text mb-1.5">الاسم الكامل</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warka-text mb-1.5">رقم الهاتف</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="07XX XXX XXXX"
                  className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warka-text mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Step 3: Academic Info */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              {form.role === 'student' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-warka-text mb-1.5">الكلية</label>
                    <input
                      type="text"
                      value={form.college}
                      onChange={(e) => updateForm('college', e.target.value)}
                      placeholder="كلية الهندسة"
                      className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warka-text mb-1.5">القسم</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => updateForm('department', e.target.value)}
                      placeholder="قسم الحاسوب"
                      className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warka-text mb-1.5">سنة التخرج</label>
                    <input
                      type="number"
                      value={form.graduationYear}
                      onChange={(e) => updateForm('graduationYear', e.target.value)}
                      placeholder="2026"
                      className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-warka-primary mx-auto mb-3" />
                  <p className="text-warka-text-secondary">ممثل الدفعة لا يحتاج بيانات أكاديمية إضافية</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Password */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-warka-text mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
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
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 py-3 border-2 border-warka-border text-warka-text text-sm font-semibold rounded-xl hover:bg-warka-bg transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex-1 py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    إنشاء الحساب
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-warka-primary hover:underline inline-flex items-center gap-1">
            لديك حساب؟ سجل الدخول
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
