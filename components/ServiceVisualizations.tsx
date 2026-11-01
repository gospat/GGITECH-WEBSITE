"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { MotionConfig, motion, useInView } from "framer-motion";
import {
  Server,
  Database,
  Globe,
  Smartphone,
  ShieldCheck,
  Cpu,
  Code,
  Layers,
  Box,
  Link as LinkIcon,
  Cloud,
} from "lucide-react";

/**
 * Decorative animation frame. The infinite loops inside these visuals are
 * paused while the visual is off-screen, and disabled entirely for visitors who
 * prefer reduced motion.
 */
function VizFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "200px" });

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} className="h-full w-full">
        {inView ? children : null}
      </div>
    </MotionConfig>
  );
}

// --- 1. Software Development Visualization (Code Building) ---
export function SoftwareDevViz() {
  return (
    <VizFrame>
      <SoftwareDevVizContent />
    </VizFrame>
  );
}

function SoftwareDevVizContent() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />

      {/* Code Editor Window */}
      <div className="w-64 bg-[#1e1e1e] rounded-lg border border-white/10 shadow-2xl overflow-hidden relative z-10">
        <div className="h-6 bg-[#2d2d2d] flex items-center px-3 gap-1.5 border-b border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <div className="p-4 space-y-2 font-mono text-[10px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            className="h-2 bg-primary/40 rounded w-3/4 overflow-hidden"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.2, repeat: Infinity, repeatDelay: 3 }}
            className="h-2 bg-purple-400/40 rounded w-1/2 overflow-hidden"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.4, repeat: Infinity, repeatDelay: 3 }}
            className="h-2 bg-emerald-400/40 rounded w-2/3 overflow-hidden"
          />
          <div className="h-2" />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.6, repeat: Infinity, repeatDelay: 3 }}
            className="h-2 bg-yellow-400/40 rounded w-5/6 overflow-hidden"
          />
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-4 top-10 bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20"
        >
          <Code className="w-5 h-5 text-blue-400" />
        </motion.div>
        <motion.div
          animate={{ y: [5, -5, 5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-4 bottom-8 bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20"
        >
          <Layers className="w-5 h-5 text-purple-400" />
        </motion.div>
      </div>
    </div>
  );
}

// --- 2. System Architecture Visualization (Hub & Spoke) ---
export function SystemArchViz() {
  return (
    <VizFrame>
      <SystemArchVizContent />
    </VizFrame>
  );
}

function SystemArchVizContent() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />

      {/* Central Hub */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              "0 0 0 0px rgba(59, 130, 246, 0.2)",
              "0 0 0 20px rgba(59, 130, 246, 0)",
              "0 0 0 0px rgba(59, 130, 246, 0)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center backdrop-blur-md"
        >
          <Server className="w-8 h-8 text-primary" />
        </motion.div>
      </div>

      {/* Nodes */}
      <ArchNode icon={<Database className="w-5 h-5 text-emerald-400" />} angle={0} delay={0} />
      <ArchNode icon={<Globe className="w-5 h-5 text-purple-400" />} angle={72} delay={1} />
      <ArchNode icon={<Smartphone className="w-5 h-5 text-yellow-400" />} angle={144} delay={2} />
      <ArchNode icon={<ShieldCheck className="w-5 h-5 text-red-400" />} angle={216} delay={3} />
      <ArchNode icon={<Cpu className="w-5 h-5 text-sky-400" />} angle={288} delay={4} />

      {/* Connections */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <Connection key={i} angle={angle} delayIndex={i} />
      ))}
    </div>
  );
}

function ArchNode({ icon, angle, delay }: { icon: React.ReactNode; angle: number; delay: number }) {
  const radius = 120;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.2, duration: 0.5 }}
      style={{ x, y }}
      className="absolute z-10 w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-xl"
    >
      {icon}
    </motion.div>
  );
}

function Connection({ angle, delayIndex }: { angle: number; delayIndex: number }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 w-[120px] h-[2px] origin-left -translate-y-1/2"
      style={{ transform: `rotate(${angle}deg) translateY(-50%)` }}
    >
      <div className="w-full h-full bg-gradient-to-r from-primary/50 to-transparent opacity-30" />
      <motion.div
        animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: delayIndex * 0.35 }}
        className="absolute top-0 w-1.5 h-1.5 rounded-full bg-white"
      />
    </div>
  );
}

// --- 3. Web3 Development Visualization (Blockchain) ---
export function Web3Viz() {
  return (
    <VizFrame>
      <Web3VizContent />
    </VizFrame>
  );
}

function Web3VizContent() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />

      <div className="flex items-center space-x-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.5, duration: 0.5 }}
              className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center backdrop-blur-md"
            >
              <Box className="w-8 h-8 text-purple-400 mb-2" />
              <div className="text-[8px] font-mono text-gray-500">Hash: 0x{i}F...</div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                <CheckIcon />
              </div>
            </motion.div>

            {i < 2 && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 32, opacity: 1 }}
                transition={{ delay: i * 0.5 + 0.3, duration: 0.3 }}
                className="h-[2px] bg-purple-500/50 relative"
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black p-1 rounded-full border border-purple-500/50">
                  <LinkIcon className="w-3 h-3 text-purple-400" />
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// --- 4. Cloud Infrastructure Visualization (Server Cluster) ---
export function CloudViz() {
  return (
    <VizFrame>
      <CloudVizContent />
    </VizFrame>
  );
}

function CloudVizContent() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />

      {/* Cloud Icon Background */}
      <Cloud className="absolute text-white/5 w-64 h-64" />

      <div className="grid grid-cols-2 gap-6 relative z-10">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -5, 0],
              borderColor: [
                "rgba(255,255,255,0.1)",
                "rgba(59, 130, 246, 0.5)",
                "rgba(255,255,255,0.1)",
              ],
            }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
            className="w-32 h-20 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center backdrop-blur-md"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Server className="w-5 h-5 text-sky-400" />
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: ["20%", "80%", "40%"] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="h-full bg-sky-400"
              />
            </div>
            <div className="text-[8px] font-mono text-gray-500 mt-1">CPU Load</div>
          </motion.div>
        ))}
      </div>

      {/* Load Balancer Lines */}
      <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-[280px] h-[280px] border border-dashed border-white/10 rounded-full"
        />
      </div>
    </div>
  );
}
