import{c as h}from"./vendor-query-Bov9BLfD.js";import{u as n,s as c}from"./index-DeAPs4-E.js";const _=r=>{const{user:s}=n();return h({queryKey:["phases-with-tasks",s==null?void 0:s.id,r],queryFn:async()=>{if(!s)throw new Error("User not authenticated");let o=c.from("phases").select(`
          *,
          tasks!tasks_phase_id_fkey(*)
        `).eq("is_active",!0);const{data:i,error:t}=await o.order("phase_order",{ascending:!0});if(t)throw t;return(i||[]).map(a=>({...a,tasks:(a.tasks||[]).filter(e=>e.is_active).sort((e,u)=>e.task_order-u.task_order)}))},enabled:!!s})};export{_ as u};
