import { useFriendRequests } from '@/hooks/useFriendship';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserCheck, UserX, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FriendRequestsList() {
  const { requests, loading, acceptRequest, rejectRequest } = useFriendRequests();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-12 w-12 cursor-pointer"
              onClick={() => navigate(`/profile/${request.profile?.user_id}`)}
            >
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(request.profile?.display_name || '?')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate(`/profile/${request.profile?.user_id}`)}
                className="font-semibold hover:text-primary transition-colors block truncate text-foreground"
              >
                {request.profile?.display_name || 'User'}
              </button>
              <p className="text-xs text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => acceptRequest(request.id)}>
                <UserCheck className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => rejectRequest(request.id)}>
                <UserX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
