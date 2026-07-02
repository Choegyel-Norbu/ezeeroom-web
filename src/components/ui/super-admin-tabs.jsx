import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Calendar, 
  Trash2, 
  Star, 
  MessageSquare, 
  Bell,
  Users,
  CreditCard
} from "lucide-react";

function SuperAdminTabs({ 
  BookingsTable, 
  HotelDeletionRequestsTable, 
  ReviewsTable, 
  FeedbacksTable, 
  HotelTable, 
  AllNotificationsTable,
  SubscriptionsTable,
  UsersTable
}) {
  return (
    <Tabs defaultValue="hotels" className="w-full">
      <ScrollArea>
        <TabsList className="mb-6 h-auto -space-x-px bg-background p-0 shadow-sm shadow-[#050203]/5 rtl:space-x-reverse">
          <TabsTrigger
            value="hotels"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <Building2
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Hotels
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <Calendar
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Bookings
          </TabsTrigger>
          <TabsTrigger
            value="deletion-requests"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <Trash2
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Deletion Requests
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <Star
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Reviews
          </TabsTrigger>
          <TabsTrigger
            value="feedbacks"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <MessageSquare
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Feedbacks
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <Bell
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <CreditCard
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="relative overflow-hidden rounded-none border border-border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            <Users
              className="-ms-0.5 me-2 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Users
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      <TabsContent value="hotels" className="mt-0">
        <HotelTable />
      </TabsContent>
      
      <TabsContent value="bookings" className="mt-0">
        <BookingsTable />
      </TabsContent>
      
      <TabsContent value="deletion-requests" className="mt-0">
        <HotelDeletionRequestsTable />
      </TabsContent>
      
      <TabsContent value="reviews" className="mt-0">
        <ReviewsTable />
      </TabsContent>
      
      <TabsContent value="feedbacks" className="mt-0">
        <FeedbacksTable />
      </TabsContent>
      
      <TabsContent value="notifications" className="mt-0">
        <AllNotificationsTable />
      </TabsContent>
      
      <TabsContent value="subscriptions" className="mt-0">
        <SubscriptionsTable />
      </TabsContent>
      
      <TabsContent value="users" className="mt-0">
        <UsersTable />
      </TabsContent>
    </Tabs>
  );
}

export { SuperAdminTabs };
