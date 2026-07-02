import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Button } from "@/shared/components/button";
import { Separator } from "@/shared/components/separator";

// Breadcrumb Component
const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link to="/" className="flex items-center hover:text-foreground transition-colors">
        
        Home
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link to={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <Card className="border-0 shadow-none p-2">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors p-2"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span className="text-left">{question}</span>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent className="p-2 pt-0">
          <div className="text-sm text-muted-foreground leading-relaxed">
            {answer}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// FAQ Section Component
const FAQSection = ({ title, faqs, openItems, onToggle }) => {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-sm sm:text-md text-foreground px-4">{title}</h2>
      </div>
      <div className="space-y-0">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openItems[`${title}-${index}`]}
            onToggle={() => onToggle(`${title}-${index}`)}
          />
        ))}
      </div>
    </div>
  );
};

const FAQs = () => {
  const [openItems, setOpenItems] = useState({});

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleItem = (key) => {
    setOpenItems(prev => {
      // If the clicked item is already open, close it
      if (prev[key]) {
        return { [key]: false };
      }
      // Otherwise, close all items and open only the clicked one
      return { [key]: true };
    });
  };

  const breadcrumbItems = [
    { label: "FAQs" }
  ];

  // Hotel Onboarding FAQs
  const hotelOnboardingFAQs = [
    {
      question: "How do I register my hotel on EzeeRoom?",
      answer: "To register your hotel, click on 'Add Your Property' in the landing page under 'Partner with EzeeRoom & Grow Your Business' section. You'll need to provide basic information about your hotel including name, location, contact details, and upload photos. Our team will review your application within 24 hours."
    },
    {
      question: "What documents do I need to register my hotel?",
      answer: "You'll need: 1) CID (Citizen Identity Document), 2) Trade License, 3) Bank Account detials, 4) Photos of rooms and facilities, 5) Valid contact information."
    },
    {
      question: "How long does the hotel approval process take?",
      answer: "The approval process typically takes less than 24 hours after you submit all required documents. Our team reviews each application to ensure quality standards and compliance with local regulations. You will discover your hotel in the search results after approval."
    },
    {
      question: "How do I manage my hotel listings and bookings?",
      answer: "Once approved, you'll get access to your hotel admin dashboard where you can: update room availability, manage pricing, view bookings, update hotel information, and track performance analytics. The dashboard is mobile-friendly for on-the-go management."
    },
    {
      question: "Can I set my own pricing and availability?",
      answer: "Yes, you have full control over your pricing and availability. You can set different rates for different seasons, room types, and special events. You can block rooms when they are unavailable for maintenance or personal use."
    }
  ];

  // Booking Process FAQs
  const bookingProcessFAQs = [
    {
      question: "How do I make a hotel booking on EzeeRoom?",
      answer: "1) Search for hotels using our search filters, 2) Select your preferred hotel and room type, 3) Choose your check-in and check-out dates 4) Enter your information 5) You will be redirected to RMA payment page, fill in you account details 6) Confirm your payment. You will see booking confirmation message and you can mange it from the dashboard."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept payments through local banks including BOB (Bank of Bhutan), BNB (Bhutan National Bank), BDBL (Bhutan Development Bank Limited), DK, and Druk PNB Bank. All payments are processed securely through encrypted channels."
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel your booking through your account dashboard. Cancellation policies vary by hotel and their own policy."
    },
    {
      question: "How do I get my booking confirmation?",
      answer: "You will see a booking notification and can check your dashboard for all booking details and confirmations."
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            
            <h1 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about hotel onboarding, booking procedures, and using EzeeRoom.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          <FAQSection
            title="Hotel Onboarding"
            faqs={hotelOnboardingFAQs}
            openItems={openItems}
            onToggle={toggleItem}
          />

          <Separator />

          <FAQSection
            title="Booking Process"
            faqs={bookingProcessFAQs}
            openItems={openItems}
            onToggle={toggleItem}
          />

        </div>
      </div>
    </div>
  );
};

export default FAQs;
