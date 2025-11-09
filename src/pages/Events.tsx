import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Events = () => {
  const events = [
    {
      title: "Community Coffee Meetup",
      date: "Nov 15, 2025",
      time: "10:00 AM",
      location: "Kahve Dünyası, İstiklal",
      attendees: 23,
      category: "Social",
    },
    {
      title: "Turkish Language Workshop",
      date: "Nov 18, 2025",
      time: "6:00 PM",
      location: "Community Center",
      attendees: 45,
      category: "Education",
    },
    {
      title: "Street Food Festival",
      date: "Nov 20, 2025",
      time: "12:00 PM",
      location: "Galata Square",
      attendees: 156,
      category: "Food & Dining",
    },
    {
      title: "Photography Walk",
      date: "Nov 22, 2025",
      time: "2:00 PM",
      location: "Galata Tower",
      attendees: 34,
      category: "Arts & Culture",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Local Events
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover and join events happening in your neighborhood
            </p>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              <Button variant="default">Upcoming</Button>
              <Button variant="outline">Past Events</Button>
            </div>
            <Button variant="hero">Create Event</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {events.map((event, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{event.category}</Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees} attending</span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="default" className="w-full">
                    RSVP
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
