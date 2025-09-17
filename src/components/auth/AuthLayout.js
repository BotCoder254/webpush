import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { FiZap, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi';

const AuthLayout = ({ children, title = "WebHook Platform" }) => {
  useEffect(() => {
    // GSAP animation for the background gradient
    gsap.to(".gradient-bg", {
      backgroundPosition: "400% 400%",
      duration: 8,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    });

    // Floating animation for feature icons
    gsap.to(".float-1", {
      y: -20,
      duration: 3,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    });

    gsap.to(".float-2", {
      y: -15,
      duration: 2.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0.5
    });

    gsap.to(".float-3", {
      y: -25,
      duration: 3.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay: 1
    });
  }, []);

  const features = [
    {
      icon: FiZap,
      title: "Lightning Fast",
      description: "Process webhooks in milliseconds with our optimized infrastructure"
    },
    {
      icon: FiShield,
      title: "Secure by Default",
      description: "Enterprise-grade security with HMAC signature validation"
    },
    {
      icon: FiTrendingUp,
      title: "Real-time Analytics",
      description: "Monitor webhook performance with detailed insights and metrics"
    },
    {
      icon: FiUsers,
      title: "Team Collaboration",
      description: "Share webhook endpoints and manage access with your team"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left Side - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div 
          className="gradient-bg absolute inset-0 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600"
          style={{
            backgroundSize: "400% 400%",
            backgroundPosition: "0% 50%"
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-xl opacity-90 leading-relaxed">
              The modern webhook platform that developers love. 
              Secure, reliable, and beautifully simple.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                className={`p-4 rounded-xl bg-white/10 backdrop-blur-sm float-${index + 1}`}
              >
                <feature.icon className="w-8 h-8 mb-3" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm opacity-80">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Decorative Elements */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-20 w-32 h-32 border border-white/20 rounded-full"
          />
          
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 left-20 w-24 h-24 border border-white/10 rounded-full"
          />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-10"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
