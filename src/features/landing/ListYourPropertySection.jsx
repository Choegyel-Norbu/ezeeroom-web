import React from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  Sparkles,
  Settings,
  CreditCard
} from "lucide-react";

// ShadCN UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/card";
import { Button } from "@/shared/components/button";
import { Badge } from "@/shared/components/badge";
import { Separator } from "@/shared/components/separator";
import { useAuth } from "@/features/authentication";

const ListYourPropertySection = ({ onLoginClick }) => {
  const { isAuthenticated } = useAuth();
  
  const handleListPropertyClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      onLoginClick();
    }
  };


  const benefits = [
    {
      icon: TrendingUp,
      title: "Increase Revenue",
      description: "Boost your booking visibility with EzeeRoom",
    },
    {
      icon: Users,
      title: "Reach More Travelers",
      description: "Access hundreds of potential guests",
    },
    {
      icon: Settings,
      title: "Easy Property Management",
      description: "Manage bookings, pricing, and availability from one dashboard",
    },
    {
      icon: CreditCard,
      title: "Secure Payment",
      description: "Secure payment processing with RMA payment gateway",
    }
  ];

  const stats = [
    { number: "30+", label: "Partner Properties" },
    { number: "95%", label: "Customer Satisfaction" },
    { number: "24/7", label: "Support Available" },
  ];

  return (
    <section id="list-your-property" className="pb-20 px-4 bg-muted/20 md:mt-10">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 space-y-4">
            <Badge variant="secondary" className="px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Become a host
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight">
              Partner with{" "}
              <span className="text-primary">
                EzeeRoom{" "}
              </span>
              & Grow Your Business
            </h2>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
              Transform your property into a thriving destination. Connect with thousands of travelers, 
              streamline your operations effortlessly, and unlock new revenue opportunities with EzeeRoom.
            </p>
          </div>

          <Separator className="" />

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Benefits */}
            <div className="space-y-8">
              {/* Stats */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* {stats.map((stat, index) => (
                  <Card key={index} className="text-center hover:shadow-md transition-shadow">
                    <CardContent className="sm:p-6">
                      <div className="text-2xl md:text-3xl font-bold text-yellow-500 mb-1">
                        {stat.number}
                      </div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))} */}
              </div>

              {/* Benefits List */}
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold tracking-tight text-gray-900">
                    Why Partner with Us?
                  </h3>
                  <p className="text-gray-500">Join the fastest growing hospitality network in Bhutan.</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="group flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <benefit.icon 
                          className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform duration-300 ease-out" 
                          strokeWidth={1.5}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                          {benefit.title}
                        </h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - CTA Card */}
            <div>
              <div className="transition-shadow duration-300 group p-2">
                {/* Property Image Section */}
                <div className="relative mb-4 sm:mb-6 p-1 sm:p-2 md:p-3 lg:p-6">
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[16/9] group rounded-md sm:rounded-lg md:rounded-xl overflow-hidden">
                    {/* Image with gradient overlay */}
                    <img
                      src="/images/previewLandingDash.png"
                      alt="EzeeRoom platform preview"
                      loading="lazy"
                      className="w-full h-full object-cover transition-all duration-500 ease-in-out opacity-0 animate-[fadeIn_1s_ease-in-out_0.2s_forwards]"
                      onError={(e) => {
                        // Fallback to a placeholder if image doesn't exist
                        e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";
                      }}
                    />
                    <style>{`
                      @keyframes fadeIn {
                        from {
                          opacity: 0;
                        }
                        to {
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                </div>

                <CardHeader className="text-center space-y-4">
                  {/* <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Home className="h-8 w-8" />
                  </div> */}
                  <div className="space-y-2 mt-4">
                    <CardTitle className="text-2xl">
                      Ready to Get Started?
                    </CardTitle>
                    <CardDescription className="text-sm">
                      List your property in minutes and start receiving bookings today. 
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    {!isAuthenticated ? (
                      // User is not authenticated
                      <Button 
                        size="lg" 
                        className="w-full sm:w-[60%] mx-auto flex bg-[#050203] hover:bg-gray-800 text-white rounded-full cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={handleListPropertyClick}
                      >
                        <span>List Your Property Today</span>
                        <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                      </Button>
                    ) : (
                      // User is authenticated - allow property listing regardless of subscription status
                      <Link to="/addListing" className="block">
                        <Button size="lg" className="w-full sm:w-[60%] mx-auto flex bg-black hover:bg-gray-800 text-white rounded-full cursor-pointer hover:scale-105 transition-transform duration-200">
                          <span>List Your Property Today</span>
                          <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                        </Button>
                      </Link>
                    )}
                    
                    {/* <Button variant="outline" size="lg" className="w-full">
                      Learn More About Partnership
                    </Button> */}
                  </div>

                  <Separator />

                </CardContent>
              </div>
            </div>
          </div>

          {/* Bottom Features */}
          {/* <div className="mt-16 text-center space-y-6">
            <Separator />
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Why property owners choose EzeeRoom
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Free trial for first two month",
                  "Easy hotel management",
                  "Real-time analytics dashboard",
                  "Secure online payments"
                ].map((feature, index) => (
                  <Badge key={index} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default ListYourPropertySection;
