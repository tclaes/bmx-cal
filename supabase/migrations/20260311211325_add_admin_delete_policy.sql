/*
  # Add Admin Delete Policy for Events

  ## Changes
  
  1. RLS Policies
    - Add DELETE policy to allow authenticated admin users to delete events
    - Policy checks that the user is authenticated
  
  ## Security
    - Only authenticated users can delete events
    - This assumes admin authentication is handled at the application level
*/

-- Add DELETE policy for events table
CREATE POLICY "Authenticated users can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (true);
