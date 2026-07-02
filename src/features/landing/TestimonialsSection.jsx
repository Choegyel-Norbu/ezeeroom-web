import React from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { StarIcon } from "@heroicons/react/24/solid";

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      quote:
        "Ezeeroom made booking in Paro effortless! Found the perfect homestay with mountain views.",
      name: "Sonam D.",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      id: 2,
      quote:
        "The real-time availability feature saved me hours of research. Booked my Thimphu hotel in minutes!",
      name: "Karma L.",
      rating: 4,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 3,
      quote:
        "As a solo traveler, I appreciated the verified reviews. My Punakha stay was exactly as described.",
      name: "Dechen W.",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
      id: 4,
      quote:
        "The restaurant recommendations were spot on. Best momos I've ever had in Bhutan!",
      name: "Tashi N.",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
  ];

  return (
    <section className="py-12 px-4 lg:px-8 bg-gray-50">
      <div className="container mx-auto">
        <Typography variant="h3" className="text-center mb-12 text-gray-900">
          Loved by Travelers Across Bhutan
        </Typography>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="h-full p-6 shadow-md hover:shadow-lg rounded-xl bg-white transition-shadow">
                <CardBody className="flex flex-col h-full p-0">
                  {/* Rating */}
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating
                            ? "text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Testimonial */}
                  <Typography
                    variant="lead"
                    className="mb-6 italic text-gray-700"
                  >
                    "{testimonial.quote}"
                  </Typography>

                  {/* User */}
                  <div className="flex items-center mt-auto">
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        loading="lazy"
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                        <span className="text-amber-600 font-medium">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <Typography variant="h6" className="text-gray-900">
                      {testimonial.name}
                    </Typography>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
