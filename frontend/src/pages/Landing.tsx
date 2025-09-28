import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shield, MessageCircle, Repeat, BookOpen, Smartphone, FileText, Users } from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and secure transactions with built-in buyer protection for peace of mind.',
    },
    {
      icon: MessageCircle,
      title: 'Chat with Sellers',
      description: 'Direct messaging system to negotiate prices and arrange meetups with sellers.',
    },
    {
      icon: Repeat,
      title: 'Easy Exchange',
      description: 'Simple item exchange system - trade your items for what you need.',
    },
  ];

  const categories = [
    { icon: BookOpen, name: 'Books', count: '1,200+ items' },
    { icon: Smartphone, name: 'Electronics', count: '800+ items' },
    { icon: FileText, name: 'Notes', count: '500+ items' },
    { icon: Users, name: 'Other', count: '300+ items' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-white py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                ShareSpace –{' '}
                <span className="text-blue-600">Buy, Sell & Exchange</span>{' '}
                in Your Campus
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Connect with fellow students to buy, sell, and exchange books, gadgets, notes, and more. 
                Your campus marketplace made simple and secure.
              </p>

              {/* Centered Search Bar */}
              <form className="w-full flex justify-center mb-8" onSubmit={e => e.preventDefault()}>
                <div className="flex w-full max-w-xl rounded-lg shadow-sm overflow-hidden border border-gray-200 bg-white">
                  <input
                    type="text"
                    placeholder="Search books, gadgets, or notes..."
                    className="flex-1 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 flex items-center justify-center"
                  >
                    {/* Magnifying glass icon from Lucide */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
    {/* AI Chatbot Widget */}
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white shadow-xl rounded-2xl p-4 w-80 border border-blue-600 flex flex-col">
        <div className="flex items-center mb-2">
          <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2 font-bold">AI</div>
          <span className="font-semibold text-gray-900">ShareSpace Chatbot</span>
        </div>
        <div className="flex-1 mb-2 text-sm text-gray-600">Hi! How can I help you today?</div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Ask me anything..." className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
              </form>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/add-listing">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    Start Selling
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Items
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <img
                  src="https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Students studying"
                  className="w-full rounded-xl"
                />
                <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold">2,800+</div>
                  <div className="text-sm">Active Listings</div>
                </div>
                <div className="absolute -top-4 -right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold">5,200+</div>
                  <div className="text-sm">Happy Students</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {/* How It Works Section */}
      {/* Testimonials Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">What Students Say</h2>
          <div className="overflow-hidden relative">
            <motion.div
              className="flex gap-8"
              animate={{ x: [0, -900] }}
              transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
              style={{ width: 'max-content' }}
            >
              {/* Repeat testimonials for seamless scroll */}
              {Array(2).fill(0).map((_, i) => (
                <>
                  <div key={`riya-${i}`} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[300px]">
                    <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Riya" className="w-16 h-16 rounded-full mb-4 shadow" />
                    <div className="text-lg font-semibold text-gray-900">Riya</div>
                    <div className="text-sm text-blue-600 mb-2">CSE</div>
                    <div className="text-gray-700 text-center italic">"I sold my old laptop in 2 days!"</div>
                  </div>
                  <div key={`aman-${i}`} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[300px]">
                    <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Aman" className="w-16 h-16 rounded-full mb-4 shadow" />
                    <div className="text-lg font-semibold text-gray-900">Aman</div>
                    <div className="text-sm text-blue-600 mb-2">ECE</div>
                    <div className="text-gray-700 text-center italic">"Found the perfect notes for my exams!"</div>
                  </div>
                  <div key={`sneha-${i}`} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[300px]">
                    <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Sneha" className="w-16 h-16 rounded-full mb-4 shadow" />
                    <div className="text-lg font-semibold text-gray-900">Sneha</div>
                    <div className="text-sm text-blue-600 mb-2">ME</div>
                    <div className="text-gray-700 text-center italic">"Easy to use and super helpful for students!"</div>
                  </div>
                </>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
            {/* Step 1 */}
            <motion.div whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(59,130,246,0.15)' }} className="flex-1 bg-blue-50 rounded-xl p-8 flex flex-col items-center transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg">
              {/* Upload icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
              <div className="text-xl font-semibold text-gray-900 mb-2">Post your item</div>
              <div className="text-gray-500 text-center">List your book, gadget, or notes for sale or exchange.</div>
            </motion.div>
            {/* Step 2 */}
            <motion.div whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(59,130,246,0.15)' }} className="flex-1 bg-green-50 rounded-xl p-8 flex flex-col items-center transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg">
              {/* MessageSquare icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2"/></svg>
              <div className="text-xl font-semibold text-gray-900 mb-2">Chat with buyer</div>
              <div className="text-gray-500 text-center">Connect and negotiate directly with interested students.</div>
            </motion.div>
            {/* Step 3 */}
            <motion.div whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(59,130,246,0.15)' }} className="flex-1 bg-purple-50 rounded-xl p-8 flex flex-col items-center transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg">
              {/* CheckCircle icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="text-xl font-semibold text-gray-900 mb-2">Sell or Exchange</div>
              <div className="text-gray-500 text-center">Complete your transaction and help another student out!</div>
            </motion.div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600">
              Find exactly what you're looking for in our organized categories
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                      <p className="text-gray-600">{category.count}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ShareSpace?
            </h2>
            <p className="text-xl text-gray-600">
              Built specifically for student needs with features that matter most
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className="text-center h-full">
                    <CardHeader>
                      <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students who are already buying, selling, and exchanging on ShareSpace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-600">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;