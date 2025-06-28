export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Cenety
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your business with our cutting-edge SaaS platform. 
            Built for modern teams who demand excellence.
          </p>
          <div className="space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>
        
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Fast & Reliable</h3>
            <p className="text-gray-600">Built with modern technologies for optimal performance</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Secure by Design</h3>
            <p className="text-gray-600">Enterprise-grade security with advanced authentication</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Scale with Ease</h3>
            <p className="text-gray-600">Grow your business without worrying about infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  )
} 