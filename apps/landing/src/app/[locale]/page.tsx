import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { Check, Shield, Zap, Users, FileText, QrCode, Clock, Award, DollarSign, Headphones } from 'lucide-react'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Ensure the locale is valid
  if (!routing.locales.includes(locale as any)) {
    return null
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Get translations - setRequestLocale sets the locale context
  const t = await getTranslations('Landing')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wide">
            {t('hero.trustBadge')}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#signup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg"
            >
              {t('hero.ctaPrimary')}
            </a>
            <a
              href="#features"
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-8 rounded-lg transition-colors text-lg"
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1: Customer Management */}
          <div className="p-8 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('features.customerManagement.title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('features.customerManagement.description')}
            </p>
          </div>

          {/* Feature 2: Quotes & Invoices */}
          <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('features.quotesInvoices.title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('features.quotesInvoices.description')}
            </p>
          </div>

          {/* Feature 3: Dynamic QR Codes */}
          <div className="p-8 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('features.dynamicQRCodes.title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('features.dynamicQRCodes.description')}
            </p>
          </div>

          {/* Feature 4: Security */}
          <div className="p-8 bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('features.secure.title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('features.secure.description')}
            </p>
          </div>

          {/* Feature 5: Fast */}
          <div className="p-8 bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('features.fast.title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('features.fast.description')}
            </p>
          </div>

          {/* Feature 6: Scalable */}
          <div className="p-8 bg-gradient-to-br from-pink-50 to-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('features.scalable.title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('features.scalable.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('benefits.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('benefits.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('benefits.saveTime.title')}
            </h3>
            <p className="text-gray-600">
              {t('benefits.saveTime.description')}
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('benefits.professional.title')}
            </h3>
            <p className="text-gray-600">
              {t('benefits.professional.description')}
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('benefits.affordable.title')}
            </h3>
            <p className="text-gray-600">
              {t('benefits.affordable.description')}
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('benefits.support.title')}
            </h3>
            <p className="text-gray-600">
              {t('benefits.support.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-gray-50 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-700 mb-6 italic leading-relaxed">
              "{t('testimonials.testimonial1.text')}"
            </p>
            <div>
              <p className="font-semibold text-gray-900">{t('testimonials.testimonial1.name')}</p>
              <p className="text-sm text-gray-600">{t('testimonials.testimonial1.role')}</p>
            </div>
          </div>

          <div className="p-8 bg-gray-50 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-700 mb-6 italic leading-relaxed">
              "{t('testimonials.testimonial2.text')}"
            </p>
            <div>
              <p className="font-semibold text-gray-900">{t('testimonials.testimonial2.name')}</p>
              <p className="text-sm text-gray-600">{t('testimonials.testimonial2.role')}</p>
            </div>
          </div>

          <div className="p-8 bg-gray-50 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-700 mb-6 italic leading-relaxed">
              "{t('testimonials.testimonial3.text')}"
            </p>
            <div>
              <p className="font-semibold text-gray-900">{t('testimonials.testimonial3.name')}</p>
              <p className="text-sm text-gray-600">{t('testimonials.testimonial3.role')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="signup" className="container mx-auto px-4 py-16 md:py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="text-center max-w-3xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle')}
          </p>
          <a
            href="/signup"
            className="inline-block bg-white text-blue-600 font-semibold py-4 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg hover:bg-gray-50"
          >
            {t('cta.button')}
          </a>
          <p className="mt-4 text-sm opacity-75">
            {t('cta.noCreditCard')}
          </p>
        </div>
      </section>
    </div>
  )
}

