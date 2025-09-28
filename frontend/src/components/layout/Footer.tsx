import { Link } from 'react-router-dom';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ShareSpace</span>
            </div>
            <p className="text-gray-600 text-sm">
              The ultimate campus marketplace for students to buy, sell, and exchange items with their peers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/marketplace" className="text-gray-600 hover:text-blue-600 text-sm">Marketplace</Link></li>
              <li><Link to="/add-listing" className="text-gray-600 hover:text-blue-600 text-sm">Sell Item</Link></li>
              <li><Link to="/dashboard" className="text-gray-600 hover:text-blue-600 text-sm">Dashboard</Link></li>
              <li><Link to="/chat" className="text-gray-600 hover:text-blue-600 text-sm">Messages</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Books</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Electronics</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Notes</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Other</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-600 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>jayswalji2019@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-600 text-sm">
                <Phone className="h-4 w-4" />
                <span>+91 123-4567</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-600 text-sm">
                <MapPin className="h-4 w-4" />
                <span>Parul university limda 391760 ,Pit  Room 365</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 ShareSpace. All rights reserved. Made for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;