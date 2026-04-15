
-- Allow participants to delete conversations they belong to
CREATE POLICY "Participants can delete conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_participants
  WHERE conversation_participants.conversation_id = conversations.id
  AND conversation_participants.user_id = auth.uid()
));

-- Allow deleting conversation participants when conversation is deleted
CREATE POLICY "Participants can delete their participation"
ON public.conversation_participants FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM conversation_participants cp
  WHERE cp.conversation_id = conversation_participants.conversation_id
  AND cp.user_id = auth.uid()
));

-- Allow deleting messages in conversations user belongs to
CREATE POLICY "Participants can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_participants
  WHERE conversation_participants.conversation_id = messages.conversation_id
  AND conversation_participants.user_id = auth.uid()
));
