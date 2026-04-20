import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useTiers } from "@/hooks/useTiers";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Download, Loader2, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/settings/customer-success/ConfirmationDialog";
import { format, parseISO, isValid as isValidDate } from "date-fns";

interface CSMInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface ParsedUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  csmEmail?: string;
  csmId?: string;
  csmName?: string;
  csmWarning?: string;
  onboardingDate?: string;
  isValid: boolean;
  validationError?: string;
}

interface InviteResult {
  username: string;
  email: string;
  success: boolean;
  error?: string;
}

interface BulkInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  isCSM?: boolean;
}

export function BulkInviteDialog({ open, onOpenChange, onComplete, isCSM = false }: BulkInviteDialogProps) {
  const { toast } = useToast();
  const { data: tiers = [] } = useTiers();
  const { data: roles = [] } = useRoles();
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "results">("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [validUsers, setValidUsers] = useState<ParsedUser[]>([]);
  const [invalidUsers, setInvalidUsers] = useState<ParsedUser[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const clientRoleId = roles.find(r => r.role_key === 'client')?.id || '';
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<InviteResult[]>([]);
  const cancelledRef = useRef(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [batchConfirmMessage, setBatchConfirmMessage] = useState("");
  const [csmList, setCsmList] = useState<CSMInfo[]>([]);

  // Batch processing configuration
  const BATCH_SIZE = 20;
  const DELAY_BETWEEN_INVITES = 3000;
  const DELAY_BETWEEN_BATCHES = 15000;

  // Fetch CSM list when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchCSMs = async () => {
      const query = supabase
        .from("user_profiles")
        .select("id, user_email, first_name, last_name, roles!inner(role_key)") as any;
      const { data } = await query
        .in("roles.role_key", ["admin", "mega_admin", "csm", "executive"])
        .eq("is_active", true);

      if (data) {
        setCsmList(
          data.map((d: any) => ({
            id: d.id,
            email: (d.user_email || "").toLowerCase(),
            firstName: d.first_name || "",
            lastName: d.last_name || "",
          }))
        );
      }
    };
    fetchCSMs();
  }, [open]);

  const handleClose = () => {
    if (processing) {
      setCancelConfirmOpen(true);
      return;
    }
    resetDialog();
    onOpenChange(false);
  };

  const confirmCancel = () => {
    setCancelConfirmOpen(false);
    cancelledRef.current = true;
    resetDialog();
    onOpenChange(false);
  };

  const resetDialog = () => {
    setStep("upload");
    setCsvFile(null);
    setParsedUsers([]);
    setValidUsers([]);
    setInvalidUsers([]);
    setSelectedTier("");
    setSelectedRole("");
    setProcessing(false);
    setProgress({ current: 0, total: 0 });
    setResults([]);
    cancelledRef.current = false;
  };

  const downloadTemplate = () => {
    const csvContent = `First Name,Last Name,Email,Phone Number,CSM Email,Onboarding Date
John,Doe,john.doe@example.com,+1234567890,csm@company.com,2026-05-01
Jane,Smith,jane.smith@example.com,,,
Bob,Johnson,bob.j@company.com,+9876543210,csm@company.com,2026-06-15`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_invite_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resolveCSM = (email: string): { csmId?: string; csmName?: string; csmWarning?: string } => {
    if (!email) return {};
    const normalized = email.toLowerCase().trim();
    const found = csmList.find((c) => c.email === normalized);
    if (found) {
      return {
        csmId: found.id,
        csmName: [found.firstName, found.lastName].filter(Boolean).join(" ") || found.email,
      };
    }
    return { csmWarning: `CSM "${email}" not found` };
  };

  const parseOnboardingDate = (value: string): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    // Try ISO format first
    const parsed = new Date(trimmed);
    if (isValidDate(parsed) && !isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return undefined;
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          toast({
            title: "Empty CSV",
            description: "The CSV file is empty or contains no valid data.",
            variant: "destructive",
          });
          return;
        }

        const firstRow = results.data[0] as any;
        const hasFirstName = "First Name" in firstRow || "first name" in firstRow || "firstName" in firstRow;
        const hasLastName = "Last Name" in firstRow || "last name" in firstRow || "lastName" in firstRow;
        const hasFullName =
          "full name" in firstRow || "Full Name" in firstRow || "username" in firstRow || "Username" in firstRow;
        const hasEmail = "email" in firstRow || "Email" in firstRow;

        if ((!hasFirstName && !hasFullName) || !hasEmail) {
          toast({
            title: "Invalid CSV Format",
            description: "CSV must contain First Name, Last Name and an Email column.",
            variant: "destructive",
          });
          return;
        }

        const users = results.data.map((row: any) => {
          let firstName = (row["First Name"] || row["first name"] || row.firstName || "").trim();
          let lastName = (row["Last Name"] || row["last name"] || row.lastName || "").trim();

          const username = `${firstName} ${lastName}`.trim();
          const email = (row.email || row.Email || "").trim();
          const phoneNumber = (row["Phone Number"] || row["phone number"] || row.phone || row.Phone || "").trim();

          // New fields
          const rawCsmEmail = (row["CSM Email"] || row["csm email"] || row["CSM email"] || "").trim();
          const rawOnboardingDate = (row["Onboarding Date"] || row["onboarding date"] || row["Onboarding date"] || "").trim();

          const csmResult = resolveCSM(rawCsmEmail);
          const onboardingDate = parseOnboardingDate(rawOnboardingDate);

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(email);
          const isValidUsername = firstName.length > 0;

          let validationError = "";
          if (!isValidUsername) validationError = "First name is required";
          else if (!isValidEmail) validationError = "Invalid email format";
          else if (rawOnboardingDate && !onboardingDate) validationError = "Invalid onboarding date format";

          return {
            username,
            email,
            firstName,
            lastName,
            phoneNumber: phoneNumber || undefined,
            csmEmail: rawCsmEmail || undefined,
            csmId: csmResult.csmId,
            csmName: csmResult.csmName,
            csmWarning: csmResult.csmWarning,
            onboardingDate,
            isValid: isValidEmail && isValidUsername && (!rawOnboardingDate || !!onboardingDate),
            validationError,
          };
        });

        const emailCount: Record<string, number> = {};
        users.forEach((user) => {
          emailCount[user.email] = (emailCount[user.email] || 0) + 1;
        });

        const processedUsers = users.map((user) => {
          if (emailCount[user.email] > 1 && user.isValid) {
            return { ...user, isValid: false, validationError: "Duplicate email in CSV" };
          }
          return user;
        });

        setParsedUsers(processedUsers);
        setValidUsers(processedUsers.filter((u) => u.isValid));
        setInvalidUsers(processedUsers.filter((u) => !u.isValid));
        setStep("preview");
      },
      error: (error) => {
        toast({
          title: "CSV Parse Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const removeUser = (email: string) => {
    const filtered = parsedUsers.filter((u) => u.email !== email);
    setParsedUsers(filtered);
    setValidUsers(filtered.filter((u) => u.isValid));
    setInvalidUsers(filtered.filter((u) => !u.isValid));
  };

  const processBulkInvites = async () => {
    const estimatedMinutes = Math.ceil(
      (validUsers.length * DELAY_BETWEEN_INVITES +
        (Math.ceil(validUsers.length / BATCH_SIZE) - 1) * DELAY_BETWEEN_BATCHES) /
        1000 /
        60,
    );

    if (validUsers.length > 10) {
      setBatchConfirmMessage(
        `You're about to invite ${validUsers.length} users in batches to avoid rate limits. Estimated time: ~${estimatedMinutes} minute${estimatedMinutes !== 1 ? "s" : ""}. Continue?`
      );
      setBatchConfirmOpen(true);
      return;
    }

    executeBulkInvites();
  };

  const postInviteActions = async (user: ParsedUser, userId: string) => {
    // Assign CSM if resolved
    if (user.csmId) {
      try {
        await supabase.rpc('assign_csm_to_user' as any, {
          p_user_id: userId,
          p_csm_id: user.csmId,
        });

        // Trigger assignment DM
        await supabase.functions.invoke("send-assignment-dm", {
          body: { user_id: userId, csm_id: user.csmId },
        });

        console.log(`✓ CSM ${user.csmId} assigned to ${user.email}`);
      } catch (err) {
        console.error(`✗ Failed to assign CSM for ${user.email}:`, err);
      }
    }

    // Set onboarding + offboarding dates
    if (user.onboardingDate) {
      try {
        const offboardingDate = new Date(user.onboardingDate);
        offboardingDate.setMonth(offboardingDate.getMonth() + 6);

        await supabase
          .from("user_profiles")
          .update({
            onboarding_date: user.onboardingDate,
            onboarding_booking_status: "scheduled",
            offboarding_date: offboardingDate.toISOString().slice(0, 10),
          } as any)
          .eq("id", userId);

        console.log(`✓ Onboarding date ${user.onboardingDate} set for ${user.email}`);
      } catch (err) {
        console.error(`✗ Failed to set dates for ${user.email}:`, err);
      }
    }
  };

  const executeBulkInvites = async () => {
    setBatchConfirmOpen(false);

    setProcessing(true);
    cancelledRef.current = false;
    setStep("processing");

    const inviteResults: InviteResult[] = [];
    const total = validUsers.length;

    const batches: ParsedUser[][] = [];
    for (let i = 0; i < validUsers.length; i += BATCH_SIZE) {
      batches.push(validUsers.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${total} users in ${batches.length} batches of ${BATCH_SIZE}`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (cancelledRef.current) break;

      const batch = batches[batchIndex];
      console.log(`Starting batch ${batchIndex + 1}/${batches.length}`);

      for (let userIndex = 0; userIndex < batch.length; userIndex++) {
        if (cancelledRef.current) break;

        const user = batch[userIndex];
        const overallIndex = batchIndex * BATCH_SIZE + userIndex;
        setProgress({ current: overallIndex + 1, total });

        let data: any = null;

        try {
          const response = await supabase.functions.invoke("invite-user", {
            body: {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.phoneNumber,
              tierId: selectedTier,
              roleId: isCSM ? clientRoleId : selectedRole,
            },
          });

          data = response.data;
          const error = response.error;

          if (error) throw error;
          if (!data?.success) throw new Error(data?.error || "Failed to invite user");

          // Run post-invite actions (CSM assignment + dates)
          const newUserId = data?.userId || data?.user_id;
          if (newUserId) {
            await postInviteActions(user, newUserId);
          }

          inviteResults.push({
            username: user.username,
            email: user.email,
            success: true,
          });

          console.log(`✓ Invited ${user.email}`);
        } catch (error: any) {
          console.error(`✗ Failed to invite ${user.email}:`, error);

          let errorMessage = "Unknown error";

          if (error?.message) {
            errorMessage = error.message;
          }

          if (data?.error) {
            errorMessage = data.error;
          }

          if (data?.statusCode === 429 || errorMessage.includes("rate limit")) {
            errorMessage = "Rate limit exceeded - Too many invites sent";
          } else if (data?.statusCode === 409 || errorMessage.includes("already")) {
            errorMessage = "User already exists or has been invited";
          } else if (data?.statusCode === 422) {
            errorMessage = "Invalid email address";
          }

          inviteResults.push({
            username: user.username,
            email: user.email,
            success: false,
            error: errorMessage,
          });

          if (data?.statusCode === 429) {
            console.log("⚠️ Rate limit detected. Pausing for 30 seconds before continuing...");
            await new Promise((resolve) => setTimeout(resolve, 30000));
          }
        }

        if (userIndex < batch.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_INVITES));
        }
      }

      if (batchIndex < batches.length - 1 && !cancelledRef.current) {
        console.log(`Batch ${batchIndex + 1} complete. Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    setResults(inviteResults);
    setProcessing(false);
    setStep("results");

    const successCount = inviteResults.filter((r) => r.success).length;
    const failedCount = inviteResults.filter((r) => !r.success).length;

    toast({
      title: "Bulk Invite Complete",
      description: `✅ ${successCount} successful${failedCount > 0 ? ` | ❌ ${failedCount} failed` : ""}`,
    });
  };

  const exportResults = () => {
    const csvRows = ["username,email,status,error"];
    results.forEach((result) => {
      const error = (result.error?.replace(/,/g, ";") || "").replace(/"/g, '""');
      csvRows.push(`"${result.username}","${result.email}","${result.success ? "Success" : "Failed"}","${error}"`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk_invite_results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDone = () => {
    onComplete();
    resetDialog();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Users in Bulk</DialogTitle>
          <DialogDescription>Upload a CSV file to invite multiple users at once</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    Upload CSV with columns:{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      First Name, Last Name, Email, Phone Number, CSM Email, Onboarding Date
                    </code>
                  </li>
                  <li>
                    <strong>CSM Email</strong> and <strong>Onboarding Date</strong> are optional — leave blank to skip
                  </li>
                  <li>Offboarding date is automatically set to 6 months after the onboarding date</li>
                  <li>Select the tier and role for all users in this upload</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-primary");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-primary");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-primary");
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileUpload(file);
                };
                input.click();
              }}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground">Only .csv files are accepted</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Badge variant="default" className="text-sm">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {validUsers.length} Valid
                  </Badge>
                  {invalidUsers.length > 0 && (
                    <Badge variant="destructive" className="text-sm">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {invalidUsers.length} Invalid
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ready to invite {validUsers.length} user{validUsers.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Select Tier for All Users <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isCSM && (
                  <div className="space-y-2">
                    <Label>
                      Select Role for All Users <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rate limit protection enabled:</strong> Invitations will be processed in batches of {BATCH_SIZE}
                with delays to prevent errors. Estimated time: ~
                {Math.ceil(
                  (validUsers.length * DELAY_BETWEEN_INVITES +
                    (Math.ceil(validUsers.length / BATCH_SIZE) - 1) * DELAY_BETWEEN_BATCHES) /
                    1000 /
                    60,
                )}{" "}
                minute
                {Math.ceil(
                  (validUsers.length * DELAY_BETWEEN_INVITES +
                    (Math.ceil(validUsers.length / BATCH_SIZE) - 1) * DELAY_BETWEEN_BATCHES) /
                    1000 /
                    60,
                ) !== 1
                  ? "s"
                  : ""}
                .
              </AlertDescription>
            </Alert>

            {invalidUsers.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {invalidUsers.length} row{invalidUsers.length !== 1 ? "s" : ""} have validation errors and will be
                  skipped
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CSM</TableHead>
                    <TableHead>Onboarding Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {user.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">{user.validationError}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.csmName ? (
                          <span className="text-sm">{user.csmName}</span>
                        ) : user.csmWarning ? (
                          <span className="text-xs text-amber-600">{user.csmWarning}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.onboardingDate ? (
                          <span className="text-sm">{format(new Date(user.onboardingDate), "MMM d, yyyy")}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeUser(user.email)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {(!selectedTier || (!isCSM && !selectedRole)) && validUsers.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select {!selectedTier && !isCSM && !selectedRole ? "a tier and role" : !selectedTier ? "a tier" : "a role"} before inviting users
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={processBulkInvites} disabled={validUsers.length === 0 || !selectedTier || (!isCSM && !selectedRole)}>
                Confirm & Invite {validUsers.length} User{validUsers.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Invitations</CardTitle>
                <CardDescription>
                  Processing batch {Math.floor((progress.current - 1) / BATCH_SIZE) + 1} of{" "}
                  {Math.ceil(progress.total / BATCH_SIZE)}
                  <br />
                  Inviting user {progress.current} of {progress.total}...
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Rate limit protection active • ~
                    {Math.ceil(
                      (progress.total * DELAY_BETWEEN_INVITES +
                        (Math.ceil(progress.total / BATCH_SIZE) - 1) * DELAY_BETWEEN_BATCHES) /
                        1000 /
                        60,
                    )}{" "}
                    min remaining
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={(progress.current / progress.total) * 100} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{Math.round((progress.current / progress.total) * 100)}% Complete</span>
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button
                variant="destructive"
                onClick={() => {
                  cancelledRef.current = true;
                  toast({
                    title: "Cancelling...",
                    description: "Bulk invite will stop after the current user.",
                  });
                }}
                disabled={!processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Successful</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold">{results.filter((r) => r.success).length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-2xl font-bold">{results.filter((r) => !r.success).length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {result.success ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{result.username}</TableCell>
                      <TableCell>{result.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.error || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={exportResults}>
                <Download className="mr-2 h-4 w-4" />
                Export Results
              </Button>
              <Button onClick={handleDone}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <ConfirmationDialog
      open={cancelConfirmOpen}
      onClose={() => setCancelConfirmOpen(false)}
      onConfirm={confirmCancel}
      title="Cancel Bulk Invite"
      description="Bulk invite is in progress. Are you sure you want to cancel?"
      confirmText="Yes, Cancel"
      isDestructive
    />

    <ConfirmationDialog
      open={batchConfirmOpen}
      onClose={() => setBatchConfirmOpen(false)}
      onConfirm={executeBulkInvites}
      title="Confirm Bulk Invite"
      description={batchConfirmMessage}
      confirmText="Continue"
    />
  </>
  );
}
