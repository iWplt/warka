import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ShoppingBag,
  ChevronLeft,
  UploadCloud,
  Plus,
  Minus,
  Award,
  Shirt,
  GraduationCap,
  PenTool,
} from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const products = [
  { id: 1, name: 'وشاح تخرج', price: 5000, icon: Award, image: '/product-sash.jpg' },
  { id: 2, name: 'رداء تخرج', price: 8000, icon: Shirt, image: '/product-gown.jpg' },
  { id: 3, name: 'قبعة تخرج', price: 3000, icon: GraduationCap, image: '/product-cap.jpg' },
  { id: 4, name: 'طلب مخصص', price: 2000, icon: PenTool, image: '' },
]

export default function StudentNewOrder() {
  const navigate = useNavigate()
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [logoFile, setLogoFile] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selected = products.find((p) => p.id === selectedProduct)
  const total = selected ? selected.price * quantity : 0

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setLogoFile(reader.result as string)
      reader.readAsDataURL(file)
      toast.success('تم رفع الشعار بنجاح')
    }
  }

  const handleSubmit = async () => {
    if (!selectedProduct) {
      toast.error('اختر منتجاً أولاً')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast.success('تم إنشاء الطلب بنجاح! رقم الطلب: #1026')
    navigate('/student/orders')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="student" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/student')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> العودة
          </button>
          <h1 className="text-2xl font-bold text-warka-text">طلب جديد</h1>
          <p className="text-sm text-warka-text-secondary mt-1">اختر منتجك وأكمل تفاصيل الطلب</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">اختر المنتج</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p.id); setQuantity(1) }}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      selectedProduct === p.id
                        ? 'border-warka-primary bg-warka-primary/5'
                        : 'border-warka-border hover:border-warka-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-warka-bg flex items-center justify-center">
                          <p.icon className="h-6 w-6 text-warka-primary" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-warka-text">{p.name}</p>
                        <p className="text-xs text-warka-text-secondary">{p.price.toLocaleString()} د.ع</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            {selected && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-card space-y-5">
                <h2 className="text-base font-bold text-warka-text">تفاصيل الطلب</h2>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-warka-text mb-2">الكمية</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center hover:bg-warka-bg-dark transition-colors">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-bold text-warka-text w-12 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center hover:bg-warka-bg-dark transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-warka-text mb-2">الشعار (اختياري)</label>
                  <div className="border-2 border-dashed border-warka-border rounded-xl p-6 text-center hover:border-warka-primary/50 transition-colors relative">
                    <input type="file" accept="image/*,.svg,.png,.jpg,.jpeg" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {logoFile ? (
                      <img src={logoFile} alt="Logo" className="h-20 mx-auto object-contain" />
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-warka-text-muted mx-auto mb-2" />
                        <p className="text-sm text-warka-text-secondary">اضغط لرفع الشعار أو اسحب وأفلت</p>
                        <p className="text-xs text-warka-text-muted mt-1">PNG, JPG, SVG — الحد الأقصى 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-warka-text mb-2">ملاحظات</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات خاصة بالطلب..."
                    rows={3}
                    className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary resize-none"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white rounded-2xl p-5 shadow-card sticky top-6">
              <h2 className="text-base font-bold text-warka-text mb-4">ملخص الطلب</h2>

              {selected ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-warka-text-secondary">{selected.name} × {quantity}</span>
                    <span className="font-semibold text-warka-text">{total.toLocaleString()} د.ع</span>
                  </div>
                  {logoFile && (
                    <div className="flex justify-between text-sm">
                      <span className="text-warka-text-secondary">شعار مخصص</span>
                      <span className="text-emerald-600 text-xs">تم الرفع</span>
                    </div>
                  )}
                  <div className="border-t border-warka-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-warka-text">الإجمالي</span>
                      <span className="font-bold text-warka-text">{total.toLocaleString()} د.ع</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        إرسال الطلب
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-warka-text-muted text-center py-6">اختر منتجاً لعرض الملخص</p>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
