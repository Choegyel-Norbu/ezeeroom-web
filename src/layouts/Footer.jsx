import React from "react";
import { Button } from "@/shared/components/button";
import { Separator } from "@/shared/components/separator";
import { Facebook, Linkedin, Youtube, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import logoER from "@/assets/images/logoER.png";
import dragonCodersLogo from "@/assets/images/Dragon-Coders-logo.png";
import TikTokIcon from "@/shared/components/TikTokIcon";

const Footer = React.forwardRef((props, ref) => {
  return (
    <footer 
      ref={ref} 
      className="bg-background border-t relative overflow-hidden"
    >
      {/* Subtle overlay to ensure content readability */}
      <div className="absolute inset-0 bg-background/85 pointer-events-none"></div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <img 
                src={logoER} 
                alt="EzeeRoom Logo" 
                className="h-6 w-auto mb-3"
              />
              <p className="text-sm text-muted-foreground mb-4">
                Travel Bhutan Smarter – Discover & Book with EzeeRoom.
              </p>
            </div>
            <div className="flex justify-center md:justify-start space-x-4">
              <Button
                variant="ghost"
                className="h-16 w-16 hover:bg-muted p-0 flex items-center justify-center"
                aria-label="Facebook"
                onClick={() => window.open("https://www.facebook.com/share/16FrEJNPGS/", "_blank")}
              >
                <Facebook className="h-10 w-10" style={{ minWidth: '2.5rem', minHeight: '2.5rem' }} />
              </Button>
              {/* <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-muted"
                aria-label="LinkedIn"
                onClick={() => window.open("https://linkedin.com/company/ezee-room", "_blank")}
              >
                <Linkedin className="h-5 w-5" />
              </Button> */}
              <Button
                variant="ghost"
                className="h-16 w-16 hover:bg-muted p-0 flex items-center justify-center"
                aria-label="TikTok"
                onClick={() => window.open("https://www.tiktok.com/@ezeeroom?_t=ZS-90GXYrhhzYW&_r=1", "_blank")}
              >
                <TikTokIcon className="h-10 w-10" style={{ minWidth: '2.5rem', minHeight: '2.5rem' }} />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                                  <a
                    href="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Home
                  </a>
              </li>
              <li>
                                  <a
                    href="/hotels"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Book Hotels
                  </a>
              </li>
              <li>
                                  <a
                    href="/aboutus"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    About Us
                  </a>
              </li>
              
            </ul>
          </nav>

          {/* Support */}
          <nav className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/faqs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Help Center
                </a>
              </li>
              <li>
                <Link
                  to="/faqs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions#cancellation-policy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Dragon Coders Private Limited
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  192 Dondrup Zur Lam 12 Se,<br />Thimphu 11001 Bhutan
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  +975 17124535
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Hong Kong Market: Thimphu, Bhutan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Query */}
        <div className="mt-8 pt-8 border-t">
          <div className="max-w-md mx-auto text-center">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Have Questions?
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Got questions about EzeeRoom or need help with your booking?
                  Feel free to reach out to us directly.
                </p>
                <Button
                  onClick={() =>
                    window.open("mailto:choegyell@gmail.com", "_blank")
                  }
                  className="w-full"
                >
                  Email Us
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-8">
          <Separator className="mb-6" />
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              © 2026 EzeeRoom. All rights reserved.
            </p>
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src={dragonCodersLogo}
                alt="Dragon Coders"
                className="h-8 w-auto"
              />
              <span className="text-sm text-muted-foreground">
                Powered by Dragon Coders Private Limited
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
