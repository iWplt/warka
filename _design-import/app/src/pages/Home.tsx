import { useNavigate } from 'react-router'
import {
  Award,
  Palette,
  Truck,
  Headset,
  ArrowLeft,
  ChevronLeft,
  Users,
  GraduationCap,
  Building2,
  Sparkles,
  Eye,
  Layers,
  BadgeCheck,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useStore } from '@/lib/store'
import { motion } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
}

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useStore()

  const features = [
    {
      icon: Award,
      title: 'جودة عالية',
      desc: 'أفضل الخامات',
    },
    {
      icon: Palette,
      title: 'تصميم أنيق',
      desc: 'تفاصيل مميزة',
    },
    {
      icon: Truck,
      title: 'توصيل سريع',
      desc: 'لباب بيتك',
    },
    {
      icon: Headset,
      title: 'دعم متواصل',
      desc: 'خدمة عملاء 24/7',
    },
  ]

  const products = [
    {
      id: 1,
      name: 'وشاح تخرج',
      price: 'يبدأ من 5,000 د.ع',
      image: '/product-sash.jpg',
    },
    {
      id: 2,
      name: 'رداء تخرج',
      price: 'يبدأ من 8,000 د.ع',
      image: '/product-gown.jpg',
    },
    {
      id: 3,
      name: 'قبعة تخرج',
      price: 'يبدأ من 3,000 د.ع',
      image: '/product-cap.jpg',
    },
    {
      id: 4,
      name: 'تصميم مخصص',
      price: 'اطلب تصميمك الخاص',
      image: '',
      isCustom: true,
    },
  ]

  const steps = [
    { num: 1, title: 'تقديم الطلب', desc: 'الطالب أو الممثل يدخل التفاصيل والمقاسات' },
    { num: 2, title: 'رفع الشعار', desc: 'أرفق شعارك عند تقديم الطلب (اختياري)' },
    { num: 3, title: 'الطباعة', desc: 'المطبعة تطبع بعد مراجعة الطلب' },
    { num: 4, title: 'التسليم', desc: 'استلام الطلب مع تتبع الحالة لحظة بلحظة' },
  ]

  const values = [
    {
      icon: Eye,
      title: 'رؤية من البداية للنهاية',
      desc: 'تتبع الطلب من الإرسال حتى التسليم',
    },
    {
      icon: BadgeCheck,
      title: 'جودة جاهزة للطباعة',
      desc: 'تطريز وطباعة احترافية + رفع شعار اختياري',
    },
    {
      icon: Users,
      title: 'مبني للدفعات',
      desc: 'الممثل يدير الصف كاملاً',
    },
    {
      icon: Layers,
      title: 'شفافية من اليوم الأول',
      desc: 'أسعار واضحة وسجل موثّق',
    },
  ]

  const audiences = [
    {
      icon: GraduationCap,
      title: 'للطالب',
      desc: 'قدّم طلبك، صمّم وشاحك، وتابع حالة الطلب',
      cta: 'دخول الطالب',
      action: () => navigate('/login'),
    },
    {
      icon: Users,
      title: 'لممثل الدفعة',
      desc: 'أدر قائمة الطلاب وطلبات جماعية',
      cta: 'دخول الممثل',
      action: () => navigate('/login'),
    },
    {
      icon: Building2,
      title: 'للجامعات والمنسقين',
      desc: 'طلبات مؤسسية وأسعار جملة',
      cta: 'تواصل معنا',
      action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }),
    },
  ]

  const marqueeItems = [
    'تتبع لحظي',
    'كتالوج المنتجات',
    'تطريز بجودة عالية',
    'تسليم في الوقت',
    'أسعار شفافة',
    'دعم مخصص',
  ]

  return (
    <div className="min-h-screen bg-warka-bg font-arabic" dir="rtl">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section id="home" className="relative bg-warka-bg overflow-hidden">
        {/* Decorative leaf shadow */}
        <div className="absolute top-0 left-0 w-64 h-64 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
            <path d="M20 180 Q 10 100, 80 50 Q 50 80, 20 180" fill="#5C5C47" />
            <path d="M20 180 Q 30 90, 100 30 Q 60 70, 20 180" fill="#4A4A38" opacity="0.7" />
            <path d="M20 180 Q 50 100, 120 60 Q 80 90, 20 180" fill="#5C5C47" opacity="0.5" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Text Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={0}
              className="text-right order-2 lg:order-1"
            >
              <span className="inline-block text-sm font-medium text-warka-primary mb-3">
                متجر طباعة التخرج
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-warka-text leading-tight mb-4">
                اصنع يوم تخرجك بثقة
              </h1>
              <p className="text-base lg:text-lg text-warka-text-secondary mb-8 leading-relaxed max-w-lg mr-auto">
                من كتالوج المنتجات حتى التسليم — منصة واحدة للطلاب وممثلي الدفعات وفريق الطباعة
              </p>
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => navigate(isAuthenticated ? '/student/orders/new' : '/login')}
                  className="px-6 py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-all duration-200 shadow-warka hover:shadow-warka-hover"
                >
                  ابدأ الآن
                </button>
                <a
                  href="#products"
                  className="px-6 py-3 border-2 border-warka-primary text-warka-primary text-sm font-semibold rounded-xl hover:bg-warka-primary hover:text-white transition-all duration-200"
                >
                  عرض المنتجات
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-10 justify-end">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warka-text">2.4k+</div>
                  <div className="text-xs text-warka-text-muted mt-1">طلبات منجزة</div>
                </div>
                <div className="w-px bg-warka-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-warka-text">98%</div>
                  <div className="text-xs text-warka-text-muted mt-1">نسبة الرضا</div>
                </div>
                <div className="w-px bg-warka-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-warka-text">48h</div>
                  <div className="text-xs text-warka-text-muted mt-1">متوسط التسليم</div>
                </div>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={1}
              className="relative order-1 lg:order-2"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-warka-hover">
                <img
                  src="/hero-image.jpg"
                  alt="WARKA Graduation Products"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center">
                  <p className="text-xs text-warka-text-secondary">
                    اطلب منتجات التخرج بأسعار واضحة ومتابعة لحظية
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="bg-warka-primary py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-8 text-sm text-white/90 font-medium flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-warka-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ===== FEATURES BAR ===== */}
      <section className="bg-white border-y border-warka-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-warka-bg flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-warka-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-warka-text">{f.title}</div>
                  <div className="text-xs text-warka-text-muted">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PHILOSOPHY ===== */}
      <section className="bg-warka-bg py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-warka-text mb-4">
              التخرج محطة مهمة — وطلبك يجب أن يكون سهلاً
            </h2>
            <p className="text-warka-text-secondary leading-relaxed mb-6">
              منصة WARKA تجمع بين الكتالوج الرقمي، تتبع الطلبات لحظياً، وإدارة المطبعة — كل ذلك في مكان واحد.
              لا حاجة للمكالمات المتكررة أو الانتظار بدون معرفة حالة طلبك.
            </p>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-warka-primary font-medium hover:underline"
            >
              اكتشف كيف يعمل
              <ChevronLeft className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ===== VALUES ===== */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-warka-bg rounded-2xl p-6 hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-warka-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="h-6 w-6 text-warka-primary" />
                </div>
                <h3 className="text-base font-bold text-warka-text mb-2">{v.title}</h3>
                <p className="text-sm text-warka-text-secondary leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCTS ===== */}
      <section id="products" className="bg-warka-bg py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-warka-text mb-2">تسوق المنتجات</h2>
            <p className="text-warka-text-secondary">اختر منتجك وابدأ طلبك الآن</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
              >
                {p.isCustom ? (
                  <div className="aspect-square bg-warka-bg flex items-center justify-center border-2 border-dashed border-warka-border m-4 rounded-xl">
                    <div className="text-center">
                      <Palette className="h-10 w-10 text-warka-primary mx-auto mb-2" />
                      <span className="text-sm text-warka-text-secondary">تصميم مخصص</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-warka-bg overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-warka-text mb-1">{p.name}</h3>
                  <p className="text-sm text-warka-text-secondary mb-3">{p.price}</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2.5 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors"
                  >
                    ابدأ طلبك
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-warka-text mb-2">كيف يعمل</h2>
            <p className="text-warka-text-secondary">أربع خطوات بسيطة من الطلب إلى التسليم</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line - desktop only */}
            <div className="hidden lg:block absolute top-8 right-[12.5%] left-[12.5%] h-0.5 border-t-2 border-dashed border-warka-border" />

            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 rounded-full border-2 border-warka-primary text-warka-primary font-bold text-xl flex items-center justify-center mx-auto mb-4 bg-white relative z-10">
                  {s.num}
                </div>
                <h3 className="text-base font-semibold text-warka-text mb-2">{s.title}</h3>
                <p className="text-sm text-warka-text-secondary leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AUDIENCE / ROLES ===== */}
      <section id="audience" className="bg-warka-bg py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-warka-text mb-2">منصة مصممة للجميع</h2>
            <p className="text-warka-text-secondary">حلول مخصصة لكل دور في رحلة التخرج</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {audiences.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-warka-primary/10 flex items-center justify-center mx-auto mb-4">
                  <a.icon className="h-7 w-7 text-warka-primary" />
                </div>
                <h3 className="text-lg font-bold text-warka-text mb-2">{a.title}</h3>
                <p className="text-sm text-warka-text-secondary mb-5 leading-relaxed">{a.desc}</p>
                <button
                  onClick={a.action}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-warka-primary text-warka-primary text-sm font-semibold rounded-xl hover:bg-warka-primary hover:text-white transition-all duration-200"
                >
                  {a.cta}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA STRIP ===== */}
      <section className="bg-warka-primary py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              طلب تخرجك، ببساطة
            </h2>
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-white/80 text-sm">
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-warka-accent" />
                تصفّح المنتجات
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-warka-accent" />
                تابع الحالة
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-warka-accent" />
                الممثل يدير الدفعات
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-white text-warka-primary text-sm font-semibold rounded-xl hover:bg-warka-bg transition-colors"
              >
                أنشئ حسابك
              </button>
              <a
                href="#contact"
                className="px-6 py-3 border-2 border-white text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                تحدث مع فريقنا
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-warka-text mb-2">تواصل معنا</h2>
            <p className="text-warka-text-secondary">نحن هنا لمساعدتك في كل خطوة</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-warka-bg rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-warka-primary/10 flex items-center justify-center mx-auto mb-3">
                <Phone className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="text-sm font-semibold text-warka-text mb-1">الهاتف</h3>
              <p className="text-sm text-warka-text-secondary" dir="ltr">+964 770 000 0000</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-warka-bg rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-warka-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="text-sm font-semibold text-warka-text mb-1">البريد</h3>
              <p className="text-sm text-warka-text-secondary">info@graduation-print.iq</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-warka-bg rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-warka-primary/10 flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="text-sm font-semibold text-warka-text mb-1">العنوان</h3>
              <p className="text-sm text-warka-text-secondary">بغداد، العراق</p>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors"
            >
              ابدأ طلبك
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
