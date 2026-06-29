import { useNavigate } from 'react-router'
import { ChevronLeft, Settings, DollarSign, Save } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

const initialPrices = [
  { product: 'وشاح تخرج', price: 5000 },
  { product: 'رداء تخرج', price: 8000 },
  { product: 'قبعة تخرج', price: 3000 },
  { product: 'طلب مخصص', price: 2000 },
]

export default function AdminSettings() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState(initialPrices)
  const [saving, setSaving] = useState(false)

  const updatePrice = (index: number, price: number) => {
    const updated = [...prices]
    updated[index].price = price
    setPrices(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success('تم حفظ الإعدادات')
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">الإعدادات</h1>
        </motion.div>

        <div className="max-w-2xl space-y-6">
          {/* Price Catalog */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-warka-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-warka-primary" /></div>
              <div><h2 className="text-base font-bold text-warka-text">كتالوج الأسعار</h2><p className="text-xs text-warka-text-secondary">تعديل أسعار المنتجات</p></div>
            </div>

            <div className="space-y-4">
              {prices.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-warka-text">{p.product}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={p.price}
                      onChange={(e) => updatePrice(i, Number(e.target.value))}
                      className="w-28 px-3 py-2 bg-warka-bg border border-warka-border rounded-xl text-sm text-right"
                    />
                    <span className="text-xs text-warka-text-muted">د.ع</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 px-6 py-2.5 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التغييرات
            </button>
          </motion.div>

          {/* Backup */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Settings className="h-5 w-5 text-blue-600" /></div>
              <div><h2 className="text-base font-bold text-warka-text">نسخ احتياطي</h2><p className="text-xs text-warka-text-secondary">إعدادات النسخ الاحتياطي</p></div>
            </div>
            <p className="text-sm text-warka-text-secondary leading-relaxed">
              يُنصح بإجراء نسخ احتياطي دوري لقاعدة البيانات. يمكنك استخدام خاصية النسخ الاحتياطي التلقائي في Supabase.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
