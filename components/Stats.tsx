"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { services } from "@/lib/content/services";
import { capabilities } from "@/lib/content/capabilities";
import { deliveryProcess } from "@/lib/content/services";

/**
 * Every figure below is derived from our own published scope of work, so it is
 * always accurate and never depends on client-attributed results we cannot
 * substantiate.
 */
const stats = [
  { label: "Core Service Lines", value: services.length, suffix: "" },
  { label: "Capability Areas", value: capabilities.length, suffix: "" },
  { label: "Stage Delivery Process", value: deliveryProcess.length, suffix: "" },
  { label: "Cloud Platforms Covered", value: 3, suffix: "" },
];

function Counter({
  from,
  to,
  duration,
  animate,
}: {
  from: number;
  to: number;
  duration: number;
  animate: boolean;
}) {
  const [count, setCount] = useState(from);
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (!animate || !inView) return;

    let frame = 0;
    let startTime: number | undefined;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * (to - from) + from));
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };
    frame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frame);
  }, [animate, inView, from, to, duration]);

  return <span ref={nodeRef}>{!animate ? to : count}</span>;
}

export default function Stats() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 bg-background relative border-y border-white/5"
      aria-label="Scope of practice"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-mono">
                <Counter from={0} to={stat.value} duration={2} animate={!shouldReduceMotion} />
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
