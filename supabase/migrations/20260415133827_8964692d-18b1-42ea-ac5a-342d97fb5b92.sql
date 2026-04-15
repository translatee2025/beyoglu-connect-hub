
-- Drop the broken SELECT policy
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;

-- Recreate with correct column reference
CREATE POLICY "Participants can view conversations"
ON public.conversations
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);
