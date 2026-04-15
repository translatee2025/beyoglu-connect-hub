import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

interface FriendRecord {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  profile?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export function useFriendship(targetUserId: string | null) {
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const currentUserId = user?.id || null;

  const checkFriendshipStatus = useCallback(async () => {
    if (!targetUserId || !currentUserId || targetUserId === currentUserId) {
      setStatus('none');
      return;
    }

    const { data } = await supabase
      .from('user_friends')
      .select('*')
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`)
      .maybeSingle();

    if (!data) {
      setStatus('none');
    } else if (data.status === 'accepted') {
      setStatus('friends');
    } else if (data.status === 'pending') {
      setStatus(data.user_id === currentUserId ? 'pending_sent' : 'pending_received');
    } else {
      setStatus('none');
    }
  }, [targetUserId, currentUserId]);

  useEffect(() => {
    checkFriendshipStatus();
  }, [checkFriendshipStatus]);

  const sendFriendRequest = async () => {
    if (!currentUserId || !targetUserId) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('user_friends')
      .insert({ user_id: currentUserId, friend_id: targetUserId, status: 'pending' });

    if (error) {
      toast({ title: error.code === '23505' ? 'Request already sent' : 'Error sending request', variant: 'destructive' });
    } else {
      toast({ title: 'Friend request sent!' });
      setStatus('pending_sent');
    }
    setLoading(false);
  };

  const acceptFriendRequest = async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    const { error } = await supabase
      .from('user_friends')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId)
      .eq('friend_id', currentUserId);

    if (error) {
      toast({ title: 'Error accepting request', variant: 'destructive' });
    } else {
      toast({ title: 'Friend request accepted!' });
      setStatus('friends');
    }
    setLoading(false);
  };

  const rejectFriendRequest = async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    const { error } = await supabase
      .from('user_friends')
      .delete()
      .eq('user_id', targetUserId)
      .eq('friend_id', currentUserId);

    if (!error) { toast({ title: 'Request rejected' }); setStatus('none'); }
    else toast({ title: 'Error', variant: 'destructive' });
    setLoading(false);
  };

  const removeFriend = async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    const { error } = await supabase
      .from('user_friends')
      .delete()
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`);

    if (!error) { toast({ title: 'Friend removed' }); setStatus('none'); }
    else toast({ title: 'Error', variant: 'destructive' });
    setLoading(false);
  };

  const cancelFriendRequest = async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    const { error } = await supabase
      .from('user_friends')
      .delete()
      .eq('user_id', currentUserId)
      .eq('friend_id', targetUserId);

    if (!error) { toast({ title: 'Request canceled' }); setStatus('none'); }
    else toast({ title: 'Error', variant: 'destructive' });
    setLoading(false);
  };

  return { status, loading, currentUserId, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, cancelFriendRequest, refresh: checkFriendshipStatus };
}

export function useFriendRequests() {
  const [requests, setRequests] = useState<FriendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('user_friends')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setRequests(data.map(r => ({ ...r, profile: profileMap.get(r.user_id) || undefined })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const acceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('user_friends')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (!error) { toast({ title: 'Friend request accepted!' }); fetchRequests(); }
    else toast({ title: 'Error', variant: 'destructive' });
  };

  const rejectRequest = async (requestId: string) => {
    const { error } = await supabase.from('user_friends').delete().eq('id', requestId);
    if (!error) { toast({ title: 'Request rejected' }); fetchRequests(); }
    else toast({ title: 'Error', variant: 'destructive' });
  };

  return { requests, loading, acceptRequest, rejectRequest, refresh: fetchRequests };
}

export function useFriendsList() {
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFriends = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('user_friends')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (data) {
      const otherIds = data.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, username')
        .in('user_id', otherIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setFriends(data.map(f => {
        const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
        return { ...f, profile: profileMap.get(otherId) || undefined };
      }));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  return { friends, loading, refresh: fetchFriends };
}
