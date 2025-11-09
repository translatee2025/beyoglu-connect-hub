import { MessageSquare, ThumbsUp, Share2, Calendar, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

const Wall = () => {
  const posts = [
    {
      user: "Sarah Johnson",
      avatar: "SJ",
      time: "2 hours ago",
      content: "Just moved to Beyoğlu! Looking forward to meeting everyone at the coffee meetup this weekend.",
      type: "status",
      likes: 12,
      comments: 3,
    },
    {
      user: "Mehmet Yılmaz",
      avatar: "MY",
      time: "4 hours ago",
      content: "Don't miss the Turkish Language Workshop this Wednesday! Limited spots available.",
      type: "event",
      likes: 28,
      comments: 7,
    },
    {
      user: "Emma Davis",
      avatar: "ED",
      time: "6 hours ago",
      content: "Selling my vintage armchair - great condition! Check out the Classifieds section.",
      type: "classified",
      likes: 15,
      comments: 5,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="w-4 h-4" />;
      case "classified":
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Community Wall
            </h1>
            <p className="text-muted-foreground text-lg">
              See what's happening in your neighborhood
            </p>
          </div>

          {/* Create Post Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-hero text-primary-foreground">
                    You
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea 
                    placeholder="Share something with your community..."
                    className="mb-3 resize-none"
                    rows={3}
                  />
                  <Button variant="default">Post</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-hero text-primary-foreground">
                        {post.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{post.user}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getTypeIcon(post.type)}
                            <span>{post.time}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-foreground">{post.content}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wall;
