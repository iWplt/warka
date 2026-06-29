import { Link } from 'react-router'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-warka-text text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/warka-logo.png" alt="WARKA" className="h-10 w-10 invert" />
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold tracking-wide">WARKA</span>
                <span className="text-[10px] text-white/60 -mt-1">متجر طباعة التخرج</span>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              منصة متكاملة لإدارة طلبات طباعة منتجات التخرج. من الكتالوج حتى التسليم — حل واحد للطلاب والممثلين وفريق الطباعة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#products" className="text-sm text-white/70 hover:text-white transition-colors">
                  منتجاتنا
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">
                  كيف يعمل
                </a>
              </li>
              <li>
                <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-white/70 hover:text-white transition-colors">
                  إنشاء حساب
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4">معلومات التواصل</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="h-4 w-4 text-warka-accent" />
                <span dir="ltr">+964 770 000 0000</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="h-4 w-4 text-warka-accent" />
                <span>info@graduation-print.iq</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="h-4 w-4 text-warka-accent mt-0.5" />
                <span>بغداد، العراق</span>
              </li>
            </ul>
          </div>

          {/* For */}
          <div>
            <h4 className="font-bold text-sm mb-4">لمنصة WARKA</h4>
            <ul className="space-y-2">
              <li className="text-sm text-white/70">للطلاب</li>
              <li className="text-sm text-white/70">لممثلي الدفعات</li>
              <li className="text-sm text-white/70">للموظفين</li>
              <li className="text-sm text-white/70">للمديرين</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © 2026 WARKA. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-white/50">
            Graduation Printing Store
          </p>
        </div>
      </div>
    </footer>
  )
}
