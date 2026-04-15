import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react';
import { useFriendship } from '@/hooks/useFriendship';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FriendButtonProps {
  targetUserId: string;
  className?: string;
}

export function FriendButton({ targetUserId, className }: FriendButtonProps) {
  const {
    status, loading, currentUserId,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, cancelFriendRequest,
  } = useFriendship(targetUserId);

  if (!currentUserId || currentUserId === targetUserId) return null;

  if (loading) {
    return <Button variant="outline" size="sm" disabled className={className}><Loader2 className="h-4 w-4 animate-spin" /></Button>;
  }

  if (status === 'none') {
    return (
      <Button variant="outline" size="sm" onClick={sendFriendRequest} className={className}>
        <UserPlus className="h-4 w-4 mr-1.5" /> Add Friend
      </Button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Button variant="secondary" size="sm" onClick={cancelFriendRequest} className={className}>
        <Clock className="h-4 w-4 mr-1.5" /> Pending
      </Button>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <Button variant="default" size="sm" onClick={acceptFriendRequest} className={className}>
          <UserCheck className="h-4 w-4 mr-1.5" /> Accept
        </Button>
        <Button variant="outline" size="sm" onClick={rejectFriendRequest}>
          <UserX className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (status === 'friends') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className={className}>
            <UserCheck className="h-4 w-4 mr-1.5" /> Friends
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={removeFriend} className="text-destructive">
            <UserX className="h-4 w-4 mr-2" /> Remove Friend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}
