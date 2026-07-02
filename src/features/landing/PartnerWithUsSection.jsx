import React from "react";
import { motion } from "framer-motion";
import { Typography, Button, Card } from "@material-tailwind/react";

const PartnerWithUsSection = () => {
  return (
    <section className="py-16 px-4 lg:px-8 bg-blue-50">
      <div className="container mx-auto">
        <Card className="rounded-2xl shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Text Content */}
            <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">
              <Typography
                variant="h2"
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Ezeeroom for Hosts & Local Businesses
              </Typography>

              <Typography variant="lead" className="text-lg text-gray-700 mb-6">
                List your hotel, homestay, or restaurant on Ezeeroom and reach
                travelers across Bhutan. We empower small businesses to thrive
                in the digital age.
              </Typography>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🏨</span>
                  <Typography variant="small" className="text-gray-700">
                    No upfront cost
                  </Typography>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🍽️</span>
                  <Typography variant="small" className="text-gray-700">
                    Easy onboarding
                  </Typography>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">📈</span>
                  <Typography variant="small" className="text-gray-700">
                    Performance analytics
                  </Typography>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">✅</span>
                  <Typography variant="small" className="text-gray-700">
                    Verified listings
                  </Typography>
                </div>
              </div>

              {/* Trust Signal */}
              <Typography
                variant="small"
                className="text-blue-600 font-medium mb-6"
              >
                Trusted by 100+ local businesses across Bhutan
              </Typography>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    color="blue"
                    className="rounded-full px-8 py-3 shadow-md hover:shadow-lg"
                  >
                    Join as a Partner
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    variant="outlined"
                    color="blue"
                    className="rounded-full px-8 py-3 border-2 hover:bg-blue-50/50"
                  >
                    List Your Business
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Image/Illustration Side */}
            <div className="hidden lg:flex bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center p-12">
                {/* Vector-style illustration */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 500 400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-500"
                >
                  {/* Building */}
                  <rect
                    x="100"
                    y="150"
                    width="300"
                    height="200"
                    rx="10"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="120"
                    y="170"
                    width="80"
                    height="80"
                    rx="5"
                    fill="#93C5FD"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="220"
                    y="170"
                    width="80"
                    height="80"
                    rx="5"
                    fill="#93C5FD"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="320"
                    y="170"
                    width="60"
                    height="80"
                    rx="5"
                    fill="#93C5FD"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />

                  {/* People */}
                  <circle cx="150" cy="300" r="15" fill="#3B82F6" />
                  <circle cx="200" cy="300" r="15" fill="#3B82F6" />
                  <path
                    d="M150 315V340H200V315"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    fill="white"
                  />

                  {/* Handshake */}
                  <path
                    d="M250 250L270 230"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M270 230L300 250"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="250"
                    cy="250"
                    r="20"
                    fill="white"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                  <circle
                    cx="300"
                    cy="250"
                    r="20"
                    fill="white"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />

                  {/* Food icon */}
                  <circle
                    cx="400"
                    cy="300"
                    r="25"
                    fill="#F59E0B"
                    opacity="0.2"
                    stroke="#F59E0B"
                    strokeWidth="2"
                  />
                  <path d="M400 280L395 290H405L400 280Z" fill="#F59E0B" />
                  <path d="M390 300L385 310H395L390 300Z" fill="#F59E0B" />
                  <path d="M410 300L405 310H415L410 300Z" fill="#F59E0B" />
                </svg>
              </div>

              {/* Floating badges */}
              <div className="absolute top-8 right-8 bg-white/90 rounded-full px-4 py-2 shadow-sm">
                <Typography variant="small" className="font-bold text-blue-600">
                  🚀 30% more bookings
                </Typography>
              </div>
              <div className="absolute bottom-8 left-8 bg-white/90 rounded-full px-4 py-2 shadow-sm">
                <Typography variant="small" className="font-bold text-blue-600">
                  ⏱️ 5-min signup
                </Typography>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default PartnerWithUsSection;
