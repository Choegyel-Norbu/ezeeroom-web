import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { Separator } from '@/shared/components/separator';
import {
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  Clock,
  Bed,
  Search,
  ArrowLeft,
  BookOpen,
  FileText,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { EzeeRoomLogo } from "@/shared/components";

const UserManual = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="hover:bg-primary/10 w-auto"
            >
              <Link to="/hotelAdmin" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium">Back</span>
              </Link>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-semibold truncate">Booking Management Guide</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Welcome to EzeeRoom Booking System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This guide will help you understand how to manage bookings for your hotel. 
              Learn how to create bookings, verify guests, and manage booking statuses effectively.
            </p>
          </CardContent>
        </Card>

        {/* Creating a Booking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              1. Creating a Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              You can create bookings for guests directly from the Booking tab. There are two types of bookings:
            </p>
              
              <div className="space-y-4 pl-3 sm:pl-4 border-l-2 border-primary/20">
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Regular Booking (Multi-day)
                  </h4>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-4 sm:ml-6 list-disc">
                    <li>For guests staying multiple nights</li>
                    <li>Select check-in and check-out dates</li>
                    <li>System calculates price automatically based on number of nights</li>
                    <li>Perfect for standard hotel stays</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Time-Based Booking (Hourly)
                  </h4>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-4 sm:ml-6 list-disc">
                    <li>For short-term stays (hourly basis)</li>
                    <li>Select date, check-in time, and duration (hours)</li>
                    <li>Ideal for day-use bookings</li>
                    <li>Minimum booking time: 1 hour</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-xs sm:text-sm mb-2">Steps to Create a Booking:</h4>
                <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-3 sm:ml-4 list-decimal">
                  <li>Go to the <strong>Booking</strong> tab in your dashboard</li>
                  <li>Click <strong>"Create New Booking"</strong> button</li>
                  <li>Select booking type (Regular or Time-Based)</li>
                  <li>Choose a room from available rooms</li>
                  <li>Enter guest information:
                    <ul className="ml-3 sm:ml-4 mt-1 list-disc">
                      <li>Guest name (required)</li>
                      <li>Phone number (required)</li>
                      <li>CID number (11 digits for Bhutanese guests)</li>
                      <li>Origin and destination (optional)</li>
                    </ul>
                  </li>
                  <li>Select dates and time (if time-based)</li>
                  <li>Enter number of guests</li>
                  <li>Review the total price</li>
                  <li>Click <strong>"Create Booking"</strong></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guest Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              2. Verifying Guests at Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              When a guest arrives, you need to verify their booking before check-in. 
              There are two verification methods available:
            </p>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="border rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                  <h4 className="font-semibold text-xs sm:text-sm">CID Verification</h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Verify guests using their Citizenship ID (CID) number.
                </p>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-3 sm:ml-4 list-disc">
                  <li>Enter the guest's 11-digit CID number</li>
                  <li>System searches for matching bookings</li>
                  <li>If found, booking details are displayed</li>
                  <li>Click <strong>"Check In"</strong> to confirm arrival</li>
                </ul>
              </div>

              <div className="border rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Bed className="h-4 w-4 text-primary flex-shrink-0" />
                  <h4 className="font-semibold text-xs sm:text-sm">Passcode Verification</h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Verify guests using their room passcode.
                </p>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-3 sm:ml-4 list-disc">
                  <li>Enter the room passcode provided to the guest</li>
                  <li>System verifies and displays booking details</li>
                  <li>Confirm guest identity</li>
                  <li>Click <strong>"Check In"</strong> to confirm arrival</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 sm:p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                <strong>Tip:</strong> Always verify the guest's identity before checking them in. 
                Make sure the booking details match the guest's information.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Managing Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              3. Managing Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              The Booking Table shows all your hotel bookings. You can view, search, and manage bookings easily.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-xs sm:text-sm">Booking Statuses:</h4>
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2 bg-muted/50 rounded">
                  <Badge variant="secondary" className="w-fit text-xs">PENDING</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">Awaiting payment or confirmation</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2 bg-muted/50 rounded">
                  <Badge variant="default" className="w-fit text-xs">CONFIRMED</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">Booking confirmed, guest not yet arrived</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2 bg-muted/50 rounded">
                  <Badge variant="default" className="w-fit text-xs">CHECKED_IN</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">Guest has arrived and checked in</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2 bg-muted/50 rounded">
                  <Badge variant="secondary" className="w-fit text-xs">CHECKED_OUT</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">Guest has completed their stay</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2 bg-muted/50 rounded">
                  <Badge variant="destructive" className="w-fit text-xs">CANCELLED</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">Booking was cancelled</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2 bg-muted/50 rounded">
                  <Badge variant="outline" className="w-fit text-xs">NO_SHOW</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">Guest did not arrive</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold text-xs sm:text-sm">Updating Booking Status:</h4>
              <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-3 sm:ml-4 list-decimal">
                <li>Go to the <strong>Booking</strong> tab</li>
                <li>Find the booking in the table (use search if needed)</li>
                <li>Click the <strong>three dots (⋮)</strong> menu on the booking row</li>
                <li>Select the new status from the dropdown:
                  <ul className="ml-3 sm:ml-4 mt-1 list-disc">
                    <li><strong>Check In</strong> - When guest arrives</li>
                    <li><strong>Check Out</strong> - When guest leaves</li>
                    <li><strong>Cancel</strong> - To cancel the booking</li>
                  </ul>
                </li>
                <li>Confirm the status change</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-xs sm:text-sm">Searching Bookings:</h4>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-3 sm:ml-4 list-disc">
                <li>Use the search bar to find bookings by guest name, phone number, or booking ID</li>
                <li>Filter bookings by status using the status dropdown</li>
                <li>View booking details by clicking on a booking row</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Booking Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              4. Booking Calendar View
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              The Booking Calendar provides a visual overview of all bookings across your rooms.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-xs sm:text-sm mb-2">Calendar Features:</h4>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 ml-3 sm:ml-4 list-disc">
                <li>See all bookings at a glance in calendar format</li>
                <li>View which rooms are booked on specific dates</li>
                <li>Navigate between months to plan ahead</li>
                <li>Identify available dates for new bookings</li>
                <li>Click on a booking to view details</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Important Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              5. Important Tips & Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-3 sm:pl-4 space-y-2">
                <h4 className="font-semibold text-xs sm:text-sm">Always Check Availability</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Before creating a booking, always check if the room is available for the selected dates. 
                  The system will show you available rooms automatically.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-3 sm:pl-4 space-y-2">
                <h4 className="font-semibold text-xs sm:text-sm">Verify Guest Information</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Always verify guest details, especially CID numbers, before confirming bookings. 
                  This ensures security and compliance.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-3 sm:pl-4 space-y-2">
                <h4 className="font-semibold text-xs sm:text-sm">Update Status Promptly</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Update booking status as soon as guests check in or out. This keeps your records accurate 
                  and helps with room availability management.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-3 sm:pl-4 space-y-2">
                <h4 className="font-semibold text-xs sm:text-sm">Handle Cancellations Properly</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  When a booking is cancelled, the room becomes available again automatically. 
                  Make sure to update the status to help guests with refunds if applicable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/hotelAdmin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/hotelAdmin#booking">
              <Calendar className="mr-2 h-4 w-4" />
              Go to Booking Tab
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserManual;

