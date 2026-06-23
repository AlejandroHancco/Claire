import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch saved theme for cross-device sync
  const { data: profile } = await supabase
    .from('profiles')
    .select('theme')
    .eq('id', user.id)
    .single();

  const theme = profile?.theme === 'pink' ? 'pink' : 'dark';
  const maxAge = 60 * 60 * 24 * 30;

  return (
    <>
      {/*
        Runs synchronously before React hydration.
        Syncs DB theme → <html> class + cookie for cross-device consistency.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var t='${theme}';var h=document.documentElement;h.className=h.className.replace(/\\b(dark|pink)\\b/g,'').trim()+' '+t;var s=location.protocol==='https:'?';secure':'';document.cookie='claire-theme='+t+';max-age=${maxAge};path=/;samesite=lax'+s;})();`,
        }}
      />
      <DashboardClient userEmail={user!.email ?? ''} userId={user!.id} />
    </>
  );
}
