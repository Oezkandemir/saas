-- Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Support Ticket Messages Table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS Policies for support_tickets

-- Allow users to view their own tickets
CREATE POLICY "Users can view their own support tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'ADMIN'
    )
  );

-- Allow users to create tickets for themselves
CREATE POLICY "Users can create their own support tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own tickets (mainly for admins)
CREATE POLICY "Users can update their own support tickets"
  ON public.support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'ADMIN'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'ADMIN'
    )
  );

-- Create RLS Policies for support_ticket_messages

-- Allow users to view messages for tickets they own or if admin
CREATE POLICY "Users can view support ticket messages they have access to"
  ON public.support_ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_id AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'ADMIN'
        )
      )
    )
  );

-- Allow users to add messages to their own tickets or if admin
CREATE POLICY "Users can add messages to their own support tickets"
  ON public.support_ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_id AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'ADMIN'
        )
      )
    )
  );

-- Enable RLS on both tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create an updated_at trigger function for the support_tickets table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Allow admins to delete tickets
CREATE POLICY "Admins can delete support tickets"
  ON public.support_tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_id_idx ON public.support_ticket_messages(ticket_id); 