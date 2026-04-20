import { supabase } from "@/integrations/supabase/client";
import ExcelJS from "exceljs";

const BRAND_GREEN = "FF2D8F64";
const LIGHT_GREEN = "FFE8F5EE";
const WHITE = "FFFFFFFF";
const DARK_TEXT = "FF333333";

const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: WHITE }, size: 11 };
const subHeaderFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GREEN } };
const cellFont: Partial<ExcelJS.Font> = { color: { argb: DARK_TEXT }, size: 10 };
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD0D0D0" } },
  bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  left: { style: "thin", color: { argb: "FFD0D0D0" } },
  right: { style: "thin", color: { argb: "FFD0D0D0" } },
};

function addHeaderRow(sheet: ExcelJS.Worksheet, headers: string[]) {
  const row = sheet.addRow(headers);
  row.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  row.height = 24;
}

function addDataRow(sheet: ExcelJS.Worksheet, values: any[]) {
  const row = sheet.addRow(values);
  row.eachCell((cell) => {
    cell.font = cellFont;
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

function autoFitColumns(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 40);
  });
}

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString() : "";

export const exportUserDataCSV = async (data: any, userId: string) => {
  const [messagesRes, leadsRes, rsvpsRes, milestonesRes, sprintRes] = await Promise.all([
    supabase.from("community_messages").select("id", { count: "exact", head: true }).eq("sender_id", userId),
    supabase.from("brand_leads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("call_rsvps" as any).select("id, status").eq("user_id", userId),
    supabase.from("csm_milestone_completions").select("id", { count: "exact", head: true }).eq("client_user_id", userId),
    supabase.from("sprint_task_progress" as any).select("id, is_completed").eq("user_id", userId),
  ]);

  const communityMessages = messagesRes.count ?? 0;
  const brandLeadsCount = leadsRes.count ?? 0;
  const rsvpData = (rsvpsRes.data || []) as any[];
  const callsRsvpdYes = rsvpData.filter((r: any) => r.status === "yes").length;
  const callsRsvpdTotal = rsvpData.length;
  const milestonesCompleted = milestonesRes.count ?? 0;
  const sprintData = (sprintRes.data || []) as any[];
  const sprintCompleted = sprintData.filter((s: any) => s.is_completed).length;
  const sprintTotal = sprintData.length;

  const profile = data.profile || {};
  const summary = data.summary || {};
  const loginStreak = data.loginStreak || {};
  const tickets = data.tickets || [];

  const wb = new ExcelJS.Workbook();
  wb.creator = "Elite E-Commerce";

  // === SUMMARY SHEET (vertical layout) ===
  const ws1 = wb.addWorksheet("Summary");
  ws1.getColumn(1).width = 28;
  ws1.getColumn(2).width = 30;

  const addSectionHeader = (sheet: ExcelJS.Worksheet, title: string) => {
    const row = sheet.addRow([title, ""]);
    sheet.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).fill = headerFill;
    row.getCell(1).font = headerFont;
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(1).border = thinBorder;
    row.height = 24;
  };

  const addKeyValueRow = (sheet: ExcelJS.Worksheet, label: string, value: any) => {
    const row = sheet.addRow([label, value ?? ""]);
    row.getCell(1).fill = subHeaderFill;
    row.getCell(1).font = { ...cellFont, bold: true };
    row.getCell(1).border = thinBorder;
    row.getCell(1).alignment = { vertical: "middle" };
    row.getCell(2).font = cellFont;
    row.getCell(2).border = thinBorder;
    row.getCell(2).alignment = { vertical: "middle", wrapText: true };
  };

  addSectionHeader(ws1, "USER PROFILE");
  addKeyValueRow(ws1, "Name", `${profile.first_name || ""} ${profile.last_name || ""}`.trim());
  addKeyValueRow(ws1, "Email", profile.user_email || "");
  addKeyValueRow(ws1, "Phone", profile.phone || "");
  addKeyValueRow(ws1, "Tier", profile.tier || "");
  addKeyValueRow(ws1, "Level", profile.level || "");
  addKeyValueRow(ws1, "Points", profile.points || 0);
  addKeyValueRow(ws1, "Revenue", profile.revenue || "");
  addKeyValueRow(ws1, "Assigned CSM", data.csmName || "Unassigned");
  addKeyValueRow(ws1, "Role", profile.role || "");
  addKeyValueRow(ws1, "Signup Date", fmtDate(profile.created_at));
  addKeyValueRow(ws1, "Last Login", fmtDate(profile.last_sign_in_at));

  addSectionHeader(ws1, "ONBOARDING");
  addKeyValueRow(ws1, "Onboarding Status", profile.onboarding_booking_status || "");
  addKeyValueRow(ws1, "Onboarding Date", fmtDate(profile.onboarding_date));
  addKeyValueRow(ws1, "Onboarding Recording", profile.onboarding_call_recording || "");

  addSectionHeader(ws1, "LOGIN & ENGAGEMENT");
  addKeyValueRow(ws1, "Current Streak", loginStreak.current_streak ?? "");
  addKeyValueRow(ws1, "Longest Streak", loginStreak.longest_streak ?? "");
  addKeyValueRow(ws1, "Total Logins", loginStreak.total_logins ?? "");
  addKeyValueRow(ws1, "Community Messages", communityMessages);
  addKeyValueRow(ws1, "Brand Leads", brandLeadsCount);
  addKeyValueRow(ws1, "Calls RSVPd (Yes/Total)", `${callsRsvpdYes}/${callsRsvpdTotal}`);

  addSectionHeader(ws1, "PROGRESS");
  addKeyValueRow(ws1, "Overall Progress", `${summary.progressPercentage || 0}%`);
  addKeyValueRow(ws1, "Completed Tasks", summary.completedTasks || 0);
  addKeyValueRow(ws1, "Total Tasks", summary.totalTasks || 0);
  addKeyValueRow(ws1, "Overdue Tasks", summary.overdueTasks || 0);
  addKeyValueRow(ws1, "Due Soon Tasks", summary.dueSoonTasks || 0);
  addKeyValueRow(ws1, "CSM Milestones", milestonesCompleted);
  addKeyValueRow(ws1, "Sprint Progress (Done/Total)", `${sprintCompleted}/${sprintTotal}`);
  addKeyValueRow(ws1, "Support Tickets", tickets.length);

  // === COURSE PROGRESS ===
  if (data.courses?.length) {
    const ws2 = wb.addWorksheet("Course Progress");
    addHeaderRow(ws2, ["Course", "Completed Tasks", "Total Tasks", "Progress %"]);
    for (const course of data.courses) {
      addDataRow(ws2, [
        course.title,
        course.completedTasks || 0,
        course.totalTasks || 0,
        `${course.progressPercentage || 0}%`,
      ]);
    }
    autoFitColumns(ws2);
  }

  // === TASK DETAILS (exclude pending) ===
  if (data.phases?.length) {
    const ws3 = wb.addWorksheet("Task Details");
    addHeaderRow(ws3, ["Phase", "Task", "Status", "Due Date", "Completed At", "Points"]);
    for (const phase of data.phases) {
      for (const task of phase.tasks || []) {
        if (task.status === "pending") continue;
        addDataRow(ws3, [
          phase.title,
          task.title,
          task.status,
          fmtDate(task.dueDate),
          fmtDate(task.response?.completed_at),
          task.points || 0,
        ]);
      }
    }
    autoFitColumns(ws3);
  }

  // === SUPPORT TICKETS ===
  if (tickets.length) {
    const ws4 = wb.addWorksheet("Support Tickets");
    addHeaderRow(ws4, ["Ticket #", "Subject", "Status", "Priority", "Type", "Created"]);
    for (const t of tickets) {
      addDataRow(ws4, [
        t.ticket_number || "",
        t.subject || "",
        t.status || "",
        t.priority || "",
        t.ticket_type || "",
        fmtDate(t.created_at),
      ]);
    }
    autoFitColumns(ws4);
  }

  // === QUIZ SUBMISSIONS ===
  if (data.quizzes?.length) {
    const ws5 = wb.addWorksheet("Quiz Submissions");
    addHeaderRow(ws5, ["Quiz", "Score", "Passed", "Attempt", "Submitted At"]);
    for (const q of data.quizzes) {
      addDataRow(ws5, [
        q.quizzes?.title || "",
        q.score || 0,
        q.passed ? "Yes" : "No",
        q.attempt_number || 1,
        fmtDate(q.submitted_at),
      ]);
    }
    autoFitColumns(ws5);
  }

  // Generate & download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = `${(profile.first_name || "user").toLowerCase()}_${(profile.last_name || userId).toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
