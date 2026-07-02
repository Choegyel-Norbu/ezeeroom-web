import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";

// ShadCN UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { Separator } from "@/shared/components/separator";

// Using Heroicons as an alternative to lucide-react
import {
  BuildingStorefrontIcon,
  CakeIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline"; // Outline icons for stats
import {
  LockClosedIcon,
  Cog6ToothIcon, // Adjusted to Cog6ToothIcon as CogIcon is usually in outline
  CloudIcon,
  HandRaisedIcon, // Using HandRaisedIcon as a general handshake alternative from heroicons
} from "@heroicons/react/24/solid"; // Solid icons for trust badges and handshake

const TrustIndicatorsSection = () => {
  const stats = [
    {
      id: 1,
      icon: <BuildingStorefrontIcon className="h-8 w-8 text-blue-500" />,
      value: 500,
      suffix: "+",
      label: "Hotels & Homestays Listed",
      emoji: "🏨",
    },
    {
      id: 2,
      icon: <CakeIcon className="h-8 w-8 text-amber-500" />, // Keeping CakeIcon as per original and adapting to 'meals discovered'
      value: 10000,
      suffix: "+",
      label: "Meals Discovered",
      emoji: "🍲",
    },
    {
      id: 3,
      icon: <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500" />,
      value: 2500,
      suffix: "+",
      label: "Verified Reviews",
      emoji: "💬",
    },
    {
      id: 4,
      icon: <HandRaisedIcon className="h-8 w-8 text-indigo-500" />, // Using HandRaisedIcon as a suitable alternative for handshake
      value: 150,
      suffix: "+",
      label: "Local Partners Empowered",
      emoji: "🤝",
    },
  ];

  const trustBadges = [
    {
      icon: <LockClosedIcon className="h-4 w-4" />,
      label: "Secure with Firebase Auth",
      variant: "outline",
      className: "border-blue-400 text-blue-600",
    },
    {
      icon: <Cog6ToothIcon className="h-4 w-4" />, // Using Cog6ToothIcon (solid)
      label: "Built on Spring Boot",
      variant: "outline",
      className: "border-purple-400 text-purple-600",
    },
    {
      icon: <CloudIcon className="h-4 w-4" />,
      label: "Powered by PostgreSQL & Firebase",
      variant: "outline",
      className: "border-teal-400 text-teal-600",
    },
  ];

  return (
    <section className="py-16 px-4 lg:px-8 bg-background">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for Bhutan, Backed by Technology
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="border-0 shadow-lg bg-card">
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-semibold text-center text-card-foreground">
                Platform Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <motion.div
                    key={stat.id}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="group"
                  >
                    <Card className="border bg-background hover:bg-accent/50 transition-colors duration-200 h-full">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          {/* Icon Container */}
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted group-hover:bg-primary/10 transition-colors duration-200">
                            {stat.icon}
                          </div>

                          {/* Counter */}
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-foreground md:text-4xl">
                              <CountUp
                                end={stat.value}
                                duration={2}
                                separator=","
                                suffix={stat.suffix}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">
                              {stat.label} {stat.emoji}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Separator className="my-8" />

              {/* Trust Badges Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-center text-card-foreground">
                  Built with Modern Technology
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {trustBadges.map((badge, index) => (
                    <Badge
                      key={index}
                      variant={badge.variant}
                      className={`${badge.className} px-4 py-2 text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-opacity`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Section */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Join thousands of travelers who trust Ezeeroom for their authentic
              Bhutanese experience
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustIndicatorsSection;
