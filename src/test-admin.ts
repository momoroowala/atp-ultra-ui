import { supabase } from '@/integrations/supabase/client';

// Test function to create admin user
export const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: 'operations@smarttradingblueprint.com',
        firstName: 'Admin',
        lastName: 'User'
      }
    });

    if (error) {
      console.error('Function error:', error);
      return;
    }

    console.log('Admin user created:', data);
    return data;
  } catch (err) {
    console.error('Error:', err);
  }
};

// Call it immediately
createAdminUser();