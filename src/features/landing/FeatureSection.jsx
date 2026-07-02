import React from "react";
import { ArrowRight, CheckCircle, Users, Shield, Search, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const FeatureSection = () => {
  return (
    <section className="px-4">
      <div className="max-w-6xl mx-auto">
        {/* Unified Hotel Booking Adventure Section */}
        <div className="text-center pt-12">
          <div className="max-w-6xl mx-auto">
            <div className="p-8 md:p-12 border border-border/50 rounded-2xl relative overflow-hidden">
              {/* Static background decorative elements */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 space-y-8">
                {/* Adventure Header */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground leading-tight">
                    Start Your Journey with
                    <span className="block text-primary">
                      Real-time Hotel Booking
                    </span>
                  </h2>
                  
                  <p className="text-sm text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Discover the perfect accommodation wherever your journey takes you. 
                    EzeeRoom connects you with authentic stays and comfortable rooms in unfamiliar destinations, 
                    making every adventure feel like home.
                  </p>
                </div>

                {/* Interactive Booking Preview */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-border/30 max-w-6xl mx-auto">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                    {/* Step 1 */}
                    <div>
                      <Link to="/hotels" className="text-center space-y-2 group cursor-pointer">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                          <Search className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Browse Hotels</h3>
                        <p className="text-xs text-muted-foreground max-w-24 group-hover:text-foreground transition-colors">Discover verified accommodations</p>
                      </Link>
                    </div>
                    
                    {/* Arrow 1 */}
                    <div className="hidden md:flex">
                      <ArrowRight className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Step 2 */}
                    <div className="text-center space-y-2 group">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Book Instantly</h3>
                      <p className="text-xs text-muted-foreground max-w-24">Real-time availability</p>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-border/50">
                  <div className="flex items-center space-x-2 group">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Secure Booking</span>
                  </div>
                  <div className="flex items-center space-x-2 group">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Verified Properties</span>
                  </div>
                  <div className="flex items-center space-x-2 group">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-muted-foreground">24/7 Support</span>
                  </div>
                  <div className="flex items-center space-x-2 group">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-muted-foreground">Secure Payment</span>
                  </div>
                </div>

                {/* Fun Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      50+
                    </div>
                    <div className="text-sm text-muted-foreground">Verified Hotels</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      500+
                    </div>
                    <div className="text-sm text-muted-foreground">Rooms Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      24/7
                    </div>
                    <div className="text-sm text-muted-foreground">Support Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      3
                    </div>
                    <div className="text-sm text-muted-foreground">Dzongkhags Covered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;