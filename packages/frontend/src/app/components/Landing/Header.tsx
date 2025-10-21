/**
 * Header Component
 *
 * Main navigation header for public pages
 * Similar to headers used by Zapier, Make, n8n, etc.
 */

import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  LogIn,
  Menu,
  Play,
  Settings,
  User,
  X,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/authStore';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  const handleAuth = () => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    } else {
      navigate('/register');
    }
  };

  // Handle dropdown hover with delay
  const handleDropdownEnter = (label: string) => {
    // Clear any pending close timeout
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setActiveDropdown(label);
  };

  const handleDropdownLeave = () => {
    // Delay closing the dropdown by 200ms
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
    setCloseTimeout(timeout);
  };

  const menuItems = [
    {
      label: 'Product',
      items: [
        {
          name: 'Features',
          href: '/features',
          description: 'Comprehensive automation features',
        },
        {
          name: 'Integrations',
          href: '/integrations',
          description: '150+ integrations available',
        },
        {
          name: 'Pricing',
          href: '/pricing',
          description: 'Transparent pricing plans',
        },
        {
          name: 'Enterprise',
          href: '/enterprise',
          description: 'Enterprise-grade solutions',
        },
        {
          name: 'Self-hosted',
          href: '/self-hosted',
          description: 'Deploy anywhere',
        },
        {
          name: 'Roadmap',
          href: '/roadmap',
          description: 'Product development roadmap',
        },
      ],
    },
    {
      label: 'Developers',
      items: [
        {
          name: 'Documentation',
          href: '/documentation',
          description: 'Complete guides and tutorials',
        },
        {
          name: 'API Reference',
          href: '/api-reference',
          description: 'REST API documentation',
        },
        {
          name: 'Node SDK',
          href: '/documentation',
          description: 'Build custom nodes',
        },
        {
          name: 'Examples',
          href: '/documentation',
          description: 'Code examples and templates',
        },
        {
          name: 'GitHub',
          href: 'https://github.com/reporunner/reporunner',
          description: 'Open source repository',
          external: true,
        },
        {
          name: 'Community',
          href: '/contact',
          description: 'Join our community',
        },
      ],
    },
    {
      label: 'Resources',
      items: [
        {
          name: 'Blog',
          href: '/documentation',
          description: 'Latest insights and tutorials',
        },
        {
          name: 'Case Studies',
          href: '/about',
          description: 'Customer success stories',
        },
        {
          name: 'Help Center',
          href: '/documentation',
          description: 'Support documentation',
        },
        {
          name: 'Status',
          href: 'https://status.reporunner.dev',
          description: 'System status',
          external: true,
        },
      ],
    },
    {
      label: 'Company',
      items: [
        { name: 'About', href: '/about', description: 'Our story and mission' },
        { name: 'Contact', href: '/contact', description: 'Get in touch' },
        { name: 'Careers', href: '/about', description: 'Join our team' },
      ],
    },
  ];

  const isActivePage = (href: string) => {
    if (href === '/' && location.pathname === '/') {
      return true;
    }
    if (href !== '/' && location.pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reporunner
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((menu, index) => (
              <div
                key={index}
                className="relative group"
                onMouseEnter={() => handleDropdownEnter(menu.label)}
                onMouseLeave={handleDropdownLeave}
              >
                <button className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-medium transition-colors py-2">
                  {menu.label}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown */}
                {activeDropdown === menu.label && (
                  <div className="absolute top-full left-0 -mt-1 pt-3 w-80 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 py-4">
                      <div className="px-4 pb-2 mb-2 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">{menu.label}</h3>
                      </div>
                      {menu.items.map((item, itemIndex) => (
                        <Link
                          key={itemIndex}
                          to={item.href}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noopener noreferrer' : undefined}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 group-hover:text-blue-600">
                                {item.name}
                              </span>
                              {item.external && <ExternalLink className="w-3 h-3 text-gray-400" />}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/app/settings')}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleAuth}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4" />
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="py-4">
              {/* Auth Section */}
              <div className="px-4 py-4 border-b border-gray-200">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/app/dashboard')}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <User className="w-5 h-5" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/app/settings')}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      Settings
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleAuth}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </button>
                    <button
                      onClick={handleGetStarted}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      <Play className="w-5 h-5" />
                      Get Started
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <div className="space-y-1 px-4 pt-4">
                {menuItems.map((menu, index) => (
                  <div key={index} className="space-y-1">
                    <div className="px-4 py-2 font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      {menu.label}
                    </div>
                    {menu.items.map((item, itemIndex) => (
                      <Link
                        key={itemIndex}
                        to={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className={`block px-4 py-3 rounded-lg transition-colors ${
                          isActivePage(item.href)
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.name}
                          {item.external && <ExternalLink className="w-3 h-3 text-gray-400" />}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
