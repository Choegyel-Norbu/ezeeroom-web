import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/shared/components/button"; // Shadcn Button
import { Gem } from "lucide-react"; // Using Lucide icon for the decorative element

const CTASection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="py-16 px-4 lg:px-8 "
    >
      <div className="container mx-auto text-center">
        {/* Bhutan-inspired decorative element */}
        <div className="flex justify-center mb-6">
          <Gem className="w-12 h-12 text-amber-500" />{" "}
          {/* Replaced SVG with Lucide Icon */}
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Ready to explore Bhutan?
        </h2>
        <p className="text-xl md:text-2xl text-gray-700 mb-2">
          Start your journey now.
        </p>

        {/* Subtext */}
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Discover hidden gems, local cuisines, and cozy stays with just a
          click.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="rounded-full px-8 py-6 shadow-md hover:shadow-lg text-white hover:bg-gray-800" // Changed to deep black background, white text
              style={{ backgroundColor: '#050203' }}
            >
              Explore Hotels
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant="outline" // Shadcn outlined variant
              className="rounded-full px-8 py-6 border-2 hover:bg-gray-100" // Changed to deep black border, deep black text, white hover
              style={{ borderColor: '#050203', color: '#050203' }}
            >
              View Restaurants
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default CTASection;
