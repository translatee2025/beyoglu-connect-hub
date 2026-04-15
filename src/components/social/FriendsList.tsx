import { useFriendsList } from '@/hooks/useFriendship';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Loader2, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function FriendsList() {
  const { friends, loading } = useFriendsList();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No friends yet</p>
        <p className="text-sm mt-1">Start adding friends to connect!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <Card key={friend.id} className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-12 w-12 cursor-pointer"
              onClick={() => navigate(`/profile/${friend.profile?.user_id}`)}
            >
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(friend.profile?.display_name || '?')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate(`/profile/${friend.profile?.user_id}`)}
                className="font-semibold hover:text-primary transition-colors block truncate text-foreground"
              >
                {friend.profile?.display_name || 'User'}
              </button>
              {friend.profile?.username && (
                <p className="text-xs text-muted-foreground">@{friend.profile.username}</p>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/messages?user=${friend.profile?.user_id}`)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
