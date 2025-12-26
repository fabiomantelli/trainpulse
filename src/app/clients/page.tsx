import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientsContent from '@/components/clients/ClientsContent'

export default async function ClientsPage() {
  // #region agent log
  const logData1 = {location:'clients/page.tsx:6',message:'ClientsPage server render start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
  await fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData1)}).catch(()=>{});
  // #endregion

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // #region agent log
  const logData2 = {location:'clients/page.tsx:12',message:'User check',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
  await fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
  // #endregion

  if (!user) {
    redirect('/auth/signin')
  }

  // #region agent log
  const logData3 = {location:'clients/page.tsx:19',message:'Rendering ClientsContent',data:{trainerId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
  await fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch(()=>{});
  // #endregion

  return <ClientsContent trainerId={user.id} />
}

