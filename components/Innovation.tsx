"use client";

import { motion } from "framer-motion";
import { Zap, Activity, BarChart, Cpu } from "lucide-react";

export default function Innovation() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Zap className="w-8 h-8 text-yellow-400" />, title: "Instant Payments", desc: "Real-time settlement" },
                { icon: <Activity className="w-8 h-8 text-red-400" />, title: "System Health", desc: "99.99% Uptime" },
                { icon: <BarChart className="w-8 h-8 text-blue-400" />, title: "Data Analytics", desc: "Actionable insights" },
                { icon: <Cpu className="w-8 h-8 text-purple-400" />, title: "AI Integration", desc: "Smart automation" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:border-primary/50 transition-colors"
                >
                  <div className="mb-4">{item.icon}</div>
                  <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
              Driving Innovation
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Driving Innovation Through <br />
              <span className="text-gradient">Technology</span>
            </h3>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              At GGI Tech, innovation is not just a concept—it is the foundation of everything we build. We focus on developing advanced digital systems that combine strong architecture, modern infrastructure, and emerging technologies.
            </p>
            
            <div className="flex items-center space-x-4">
              <div className="h-12 w-1 bg-primary rounded-full"></div>
              <div>
                <p className="text-white font-bold text-lg">Key Innovation Areas</p>
                <p className="text-gray-500">Enterprise Digital Systems, Health Technology, Blockchain Infrastructure, Cloud-Based Systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
