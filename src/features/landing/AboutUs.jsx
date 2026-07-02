import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Separator } from '@/shared/components/separator';
import { Badge } from '@/shared/components/badge';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { EzeeRoomLogo } from "@/shared/components";

const AboutUs = () => {
  return (
    <div className="min-h-screen mb-10">

      {/* Modern Header */}
      <div className="relative  border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="block sm:hidden py-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="hover:bg-primary/10 transition-colors"
              >
                <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Back</span>
                </Link>
              </Button>
              
              <div className="flex-1 flex justify-center">
                <Badge variant="outline" className="text-xs">
                  About Us
                </Badge>
              </div>
              
              <div className="w-20"></div> {/* Balance */}
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:block py-6">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <div className="flex-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="hover:bg-primary/10 transition-colors group"
                >
                  <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Back to Home</span>
                  </Link>
                </Button>
              </div>
              
              {/* Logo */}
              <div className="flex-1 flex justify-center">
                <div className="text-center">
                  <EzeeRoomLogo size="large" />
                </div>
              </div>
              
              {/* Right Side - Navigation Links */}
              <div className="flex-1 flex justify-end">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/hotels" className="text-sm font-medium hover:text-primary transition-colors">
                      Hotels
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none"></div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 space-y-12">
        {/* Why EzeeRoom */}
        

        <Separator />

        {/* Our Mission */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading flex items-center gap-2">
                Our Mission
              </CardTitle>
              <CardDescription>
                Empowering Bhutan's hospitality ecosystem through digital platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mission Statement */}
             

              {/* Core Mission Pillars */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* For Accommodation Providers */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">For Accommodation Providers</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We empower remote accommodations to become digitally accessible to travelers 
                    by providing comprehensive property management systems that simplify 
                    operations and streamline bookings
                  </p>
                </div>

                {/* For Travelers */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">For Travelers</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We create seamless discovery and booking experiences that enable travelers 
                    to easily find accommodations, compare options, and make informed decisions 
                    with complete transparency and convenience.
                  </p>
                </div>
              </div>

              {/* Vision Statement */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-sm">Our Vision</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To become Bhutan's trusted platform that empowers our community 
                  by connecting travelers with local accommodations.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>


        <Separator />

        {/* Get in Touch */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" />
                Get in Touch
              </CardTitle>
              <CardDescription>
                We're available for you. Just leave us a message!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Address</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                    Thimphu 11001 Bhutan<br />
                    192 Dondrup Zur Lam 12 Se,<br />
                    HongKong Market, Thimphu, Bhutan
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Email</span>
                  </div>
                  <a
                    href="mailto:info@dcpl.bt"
                    className="text-sm text-primary hover:underline pl-6 block"
                  >
                    info@dcpl.bt
                  </a>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Call Us</span>
                  </div>
                  <a
                    href="tel:+97517124535"
                    className="text-sm text-primary hover:underline pl-6 block"
                  >
                    +975 17124535
                  </a>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Office Hours</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    Monday–Friday: 9am – 5pm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;

