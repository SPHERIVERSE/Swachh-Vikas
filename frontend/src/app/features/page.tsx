'use client';

import Link from 'next/link';

export default function FeaturesPage() {
  const features = [
    {
      category: "For Citizens",
      icon: "👥",
      color: "from-blue-500 to-blue-600",
      features: [
        {
          title: "Smart Waste Reporting",
          description: "Report waste issues with photos, location, and priority levels",
          icon: "📱"
        },
        {
          title: "Pickup Scheduling",
          description: "Schedule convenient pickup times for different waste types",
          icon: "📅"
        },
        {
          title: "Reward System",
          description: "Earn points and rewards for responsible waste disposal",
          icon: "🏆"
        },
        {
          title: "Educational Resources",
          description: "Learn about waste segregation and environmental impact",
          icon: "📚"
        }
      ]
    },
    {
      category: "For Workers",
      icon: "👷",
      color: "from-green-500 to-green-600",
      features: [
        {
          title: "Route Optimization",
          description: "AI-powered route planning for maximum efficiency",
          icon: "🗺️"
        },
        {
          title: "Task Management",
          description: "Digital task assignment and completion tracking",
          icon: "✅"
        },
        {
          title: "Real-time Tracking",
          description: "GPS tracking and status updates for transparency",
          icon: "📍"
        },
        {
          title: "Performance Analytics",
          description: "Track performance metrics and improvement areas",
          icon: "📊"
        }
      ]
    },
    {
      category: "For Authorities",
      icon: "🏛️",
      color: "from-purple-500 to-purple-600",
      features: [
        {
          title: "City-wide Monitoring",
          description: "Comprehensive dashboard for waste management oversight",
          icon: "🌆"
        },
        {
          title: "Data Analytics",
          description: "Advanced analytics for informed decision making",
          icon: "📈"
        },
        {
          title: "Policy Management",
          description: "Implement and track waste management policies",
          icon: "📋"
        },
        {
          title: "Resource Allocation",
          description: "Optimize resource distribution across the city",
          icon: "⚖️"
        }
      ]
    }
  ];

  const technicalFeatures = [
    {
      title: "AI-Powered Classification",
      description: "Automatically classify waste types using computer vision and machine learning",
      icon: "🤖",
      color: "from-orange-500 to-red-500"
    },
    {
      title: "IoT Sensor Integration",
      description: "Smart bins with sensors for fill-level monitoring and optimization",
      icon: "📡",
      color: "from-teal-500 to-cyan-500"
    },
    {
      title: "Predictive Analytics",
      description: "Forecast waste generation patterns and optimize collection schedules",
      icon: "🔮",
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Blockchain Tracking",
      description: "Transparent and immutable waste tracking from source to disposal",
      icon: "🔗",
      color: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="eco-gradient-text">Powerful Features</span>
            <br />
            <span className="text-gray-800">for Everyone</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform offers tailored solutions for every stakeholder in the waste management ecosystem.
          </p>
        </div>

        {/* Role-based Features */}
        <div className="space-y-20 mb-20">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex} className="relative">
              <div className="text-center mb-12">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${category.color} rounded-2xl text-3xl mb-4`}>
                  {category.icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-900">{category.category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="eco-card p-6 hover:shadow-xl transition-all duration-300">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Technical Features */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Technology</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cutting-edge technology powering the future of waste management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technicalFeatures.map((feature, index) => (
              <div key={index} className="eco-card p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Features */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-12 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Seamless Integration</h2>
            <p className="text-xl text-gray-600">
              Connect with existing systems and third-party services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Integration</h3>
              <p className="text-gray-600">
                RESTful APIs for easy integration with existing municipal systems and third-party applications.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Analytics</h3>
              <p className="text-gray-600">
                Live dashboards and reporting tools that provide actionable insights for better decision making.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Compliant</h3>
              <p className="text-gray-600">
                Enterprise-grade security with compliance to data protection regulations and industry standards.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Experience These Features?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users already transforming waste management in their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="eco-button eco-button-primary text-lg px-8 py-4"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/contact" 
              className="eco-button eco-button-secondary text-lg px-8 py-4"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
