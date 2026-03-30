import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://qdtblykzrettknvpalqc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdGJseWt6cmV0dGtudnBhbHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODg0NDksImV4cCI6MjA5MDI2NDQ0OX0.97ZwdfyphVXk1KIdXGRD5-Vn-V04MsqquTnd8EpsKcs'
)