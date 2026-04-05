import { useState, useRef, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  ArrowRight, ArrowLeft, CalendarIcon, Table2, Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import type { BrandLeadInsert } from '@/hooks/useBrandLeads';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/19KjRyjR89hft9dGnE6a-vSTtIxzJH-Byqp9cHlh_tvg/export?format=csv&gid=380864053';
const TEMPLATE_VIEW_URL = 'https://docs.google.com/spreadsheets/d/19KjRyjR89hft9dGnE6a-vSTtIxzJH-Byqp9cHlh_tvg/edit?gid=380864053#gid=380864053';

type MappableField = keyof Omit<BrandLeadInsert, 'user_id'>;

const HEADER_MAP: Record<string, MappableField> = {
  'company brand name': 'company_brand_name',
  'company name': 'company_brand_name',
  'brand name': 'company_brand_name',
  'brand': 'company_brand_name',
  'company': 'company_brand_name',
  'name': 'company_brand_name',
  'category': 'category',
  'contact name': 'contact_name',
  'contact': 'contact_name',
  'contact person': 'contact_name',
  'email address': 'email',
  'email': 'email',
  'e-mail': 'email',
  'phone#': 'phone',
  'phone': 'phone',
  'phone number': 'phone',
  'last email sent date': 'last_email_sent_date',
  'email sent date': 'last_email_sent_date',
  'date emailed': 'last_email_sent_date',
  'status': 'status',
  'business model': 'business_model',
  'website': 'website',
  'url': 'website',
  'site': 'website',
  'state': 'state',
  'amazon lead product': 'amazon_lead_product_url',
  'amazon lead product url': 'amazon_lead_product_url',
  'amazon url': 'amazon_lead_product_url',
  'amazon link': 'amazon_lead_product_url',
  'product url': 'amazon_lead_product_url',
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
};

const DB_FIELDS: { value: MappableField; label: string; required?: boolean }[] = [
  { value: 'company_brand_name', label: 'Company / Brand Name', required: true },
  { value: 'category', label: 'Category' },
  { value: 'contact_name', label: 'Contact Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'last_email_sent_date', label: 'Last Email Sent Date' },
  { value: 'status', label: 'Status' },
  { value: 'business_model', label: 'Business Model' },
  { value: 'website', label: 'Website' },
  { value: 'state', label: 'State' },
  { value: 'amazon_lead_product_url', label: 'Amazon Lead Product URL' },
  { value: 'notes', label: 'Notes' },
];

const FOLLOW_UP_OPTIONS = [
  { value: '3', label: '3 days' },
  { value: '5', label: '5 days' },
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: 'custom', label: 'Custom date' },
];

// ---------------------------------------------------------------------------
// CSV helpers (preserved from original)
// ---------------------------------------------------------------------------

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '""';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
        current += ch;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        current += ch;
      } else if (ch === '\r' && text[i + 1] === '\n') {
        rows.push(current);
        current = '';
        i++;
      } else if (ch === '\n') {
        rows.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  if (current) rows.push(current);
  return rows.filter(r => r.trim());
}

function normalizeDate(val: string): string | null {
  if (!val) return null;
  // Try M/D/YYYY or MM/DD/YYYY
  const slashMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  return null;
}

// ---------------------------------------------------------------------------
// Fuzzy matching helper
// ---------------------------------------------------------------------------

/** Normalize a string for fuzzy header matching */
function normalizeHeader(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Try to auto-map a file column header to a DB field */
function autoMatchField(header: string): MappableField | null {
  const norm = normalizeHeader(header);
  // Direct lookup
  if (HEADER_MAP[norm]) return HEADER_MAP[norm];
  // Substring match against HEADER_MAP keys
  for (const [key, field] of Object.entries(HEADER_MAP)) {
    if (norm.includes(key) || key.includes(norm)) return field;
  }
  return null;
}

// ---------------------------------------------------------------------------
// localStorage reminder helpers
// ---------------------------------------------------------------------------

interface ImportReminder {
  batchId: string;
  importDate: string;
  outreachDate: string;
  followUpDate: string;
  leadCount: number;
  dismissed: boolean;
}

function saveReminder(reminder: ImportReminder) {
  try {
    const raw = localStorage.getItem('brand_leads_reminders');
    const list: ImportReminder[] = raw ? JSON.parse(raw) : [];
    list.push(reminder);
    localStorage.setItem('brand_leads_reminders', JSON.stringify(list));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

function generateBatchId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'upload' | 'mapping' | 'outreach' | 'importing';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: Omit<BrandLeadInsert, 'user_id'>[]) => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BulkImportDialog = ({ open, onOpenChange, onImport, isLoading }: BulkImportDialogProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  // Step management
  const [step, setStep] = useState<Step>('upload');

  // Upload state
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [parseError, setParseError] = useState('');

  // Mapping state: index = file column index, value = DB field or '__skip__'
  const [columnMapping, setColumnMapping] = useState<(MappableField | '__skip__')[]>([]);
  const [mappingError, setMappingError] = useState('');

  // Outreach state
  const [outreachOption, setOutreachOption] = useState<'already' | 'today' | 'planned'>('today');
  const [plannedDate, setPlannedDate] = useState<Date | undefined>(undefined);
  const [followUpOption, setFollowUpOption] = useState('7');
  const [customFollowUpDate, setCustomFollowUpDate] = useState<Date | undefined>(undefined);

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const reset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setFileHeaders([]);
    setFileRows([]);
    setParseError('');
    setColumnMapping([]);
    setMappingError('');
    setOutreachOption('today');
    setPlannedDate(undefined);
    setFollowUpOption('7');
    setCustomFollowUpDate(undefined);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  // ---------------------------------------------------------------------------
  // File parsing
  // ---------------------------------------------------------------------------

  const parseFileData = useCallback((headers: string[], rows: string[][]) => {
    if (headers.length === 0) {
      setParseError('File appears empty or has no header row.');
      return;
    }

    setFileHeaders(headers);
    setFileRows(rows);

    // Auto-map columns
    const usedFields = new Set<MappableField>();
    const mapping: (MappableField | '__skip__')[] = headers.map((h) => {
      const match = autoMatchField(h);
      if (match && !usedFields.has(match)) {
        usedFields.add(match);
        return match;
      }
      return '__skip__';
    });
    setColumnMapping(mapping);
    setParseError('');
    setStep('mapping');
  }, []);

  const processCSV = useCallback((text: string) => {
    const lines = splitCSVRows(text);
    if (lines.length < 2) {
      setParseError('File appears empty or has no data rows.');
      return;
    }

    // Find the header row - first row that looks like headers (check first 10 rows)
    let headerIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('company') || lower.includes('brand') || lower.includes('email') || lower.includes('name')) {
        headerIdx = i;
        break;
      }
    }

    const headers = parseCSVLine(lines[headerIdx]);
    const dataRows: string[][] = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.some(c => c.trim())) {
        dataRows.push(cols);
      }
    }

    parseFileData(headers, dataRows);
  }, [parseFileData]);

  const processExcel = useCallback((buffer: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setParseError('Excel file has no sheets.');
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const aoa: string[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        defval: '',
      }) as string[][];

      if (aoa.length < 2) {
        setParseError('File appears empty or has no data rows.');
        return;
      }

      // Find header row
      let headerIdx = 0;
      for (let i = 0; i < Math.min(aoa.length, 10); i++) {
        const row = aoa[i];
        const joined = row.join(' ').toLowerCase();
        if (joined.includes('company') || joined.includes('brand') || joined.includes('email') || joined.includes('name')) {
          headerIdx = i;
          break;
        }
      }

      const headers = aoa[headerIdx].map(h => String(h ?? ''));
      const dataRows = aoa.slice(headerIdx + 1).filter(row => row.some(c => String(c ?? '').trim()));

      parseFileData(headers, dataRows.map(row => row.map(c => String(c ?? ''))));
    } catch (err) {
      setParseError(`Failed to parse Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [parseFileData]);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setParseError('');

    const ext = file.name.toLowerCase().split('.').pop();

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        processCSV(ev.target?.result as string);
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        processExcel(ev.target?.result as ArrayBuffer);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setParseError('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.');
    }
  }, [processCSV, processExcel]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // ---------------------------------------------------------------------------
  // Mapping helpers
  // ---------------------------------------------------------------------------

  /** Which DB fields are currently assigned to some column */
  const usedFields = useMemo(() => {
    const set = new Set<MappableField>();
    columnMapping.forEach((m) => {
      if (m !== '__skip__') set.add(m);
    });
    return set;
  }, [columnMapping]);

  const updateMapping = (colIdx: number, value: string) => {
    setColumnMapping((prev) => {
      const next = [...prev];
      next[colIdx] = value as MappableField | '__skip__';
      return next;
    });
    setMappingError('');
  };

  const isMappingValid = useMemo(() => {
    return columnMapping.includes('company_brand_name');
  }, [columnMapping]);

  /** Preview rows (first 3) */
  const previewRows = useMemo(() => fileRows.slice(0, 3), [fileRows]);

  // ---------------------------------------------------------------------------
  // Build leads from mapping
  // ---------------------------------------------------------------------------

  const buildLeads = useCallback((): { valid: Omit<BrandLeadInsert, 'user_id'>[]; errors: string[] } => {
    const valid: Omit<BrandLeadInsert, 'user_id'>[] = [];
    const errors: string[] = [];

    // Determine outreach date & status overrides
    const today = format(new Date(), 'yyyy-MM-dd');
    let outreachDate: string | null = null;
    let statusOverride: string | null = null;

    if (outreachOption === 'already' || outreachOption === 'today') {
      outreachDate = today;
      statusOverride = 'Email Sent';
    } else if (outreachOption === 'planned' && plannedDate) {
      outreachDate = format(plannedDate, 'yyyy-MM-dd');
      statusOverride = 'Email Sent';
    }

    for (let i = 0; i < fileRows.length; i++) {
      const cols = fileRows[i];
      const row: Record<string, string> = {};

      columnMapping.forEach((field, ci) => {
        if (field !== '__skip__' && cols[ci]?.trim()) {
          row[field as string] = cols[ci].trim();
        }
      });

      if (!row.company_brand_name) {
        if (Object.values(row).some(v => v)) {
          errors.push(`Row ${i + 2}: Missing company/brand name - skipped.`);
        }
        continue;
      }

      // Determine last_email_sent_date: outreach override takes priority, then mapped value
      let emailDate = outreachDate;
      if (!emailDate && row.last_email_sent_date) {
        emailDate = normalizeDate(row.last_email_sent_date);
      }

      // Determine status: outreach override takes priority, then mapped value
      const finalStatus = statusOverride || row.status || 'Email Sent';

      valid.push({
        company_brand_name: row.company_brand_name,
        category: row.category || null,
        contact_name: row.contact_name || null,
        email: row.email || null,
        phone: row.phone || null,
        last_email_sent_date: emailDate || null,
        status: finalStatus,
        business_model: row.business_model || 'Brand',
        website: row.website || null,
        state: row.state || null,
        amazon_lead_product_url: row.amazon_lead_product_url || null,
        notes: row.notes || null,
      });
    }

    return { valid, errors };
  }, [fileRows, columnMapping, outreachOption, plannedDate]);

  // ---------------------------------------------------------------------------
  // Final import
  // ---------------------------------------------------------------------------

  const handleImport = () => {
    const { valid, errors } = buildLeads();
    if (valid.length === 0) {
      setMappingError(errors[0] || 'No valid leads found.');
      return;
    }

    // Save reminder to localStorage
    const today = format(new Date(), 'yyyy-MM-dd');
    let outreachDate = today;
    if (outreachOption === 'planned' && plannedDate) {
      outreachDate = format(plannedDate, 'yyyy-MM-dd');
    }

    let followUpDate: string;
    if (followUpOption === 'custom' && customFollowUpDate) {
      followUpDate = format(customFollowUpDate, 'yyyy-MM-dd');
    } else {
      const days = parseInt(followUpOption, 10) || 7;
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + days);
      followUpDate = format(fDate, 'yyyy-MM-dd');
    }

    saveReminder({
      batchId: generateBatchId(),
      importDate: today,
      outreachDate,
      followUpDate,
      leadCount: valid.length,
      dismissed: false,
    });

    onImport(valid);
  };

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  const goToOutreach = () => {
    if (!isMappingValid) {
      setMappingError('You must map a column to "Company / Brand Name" before continuing.');
      return;
    }
    setMappingError('');
    setStep('outreach');
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderUploadStep = () => (
    <div className="space-y-5 pt-2">
      {/* Template links */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Step 1: Download Template (optional)</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={TEMPLATE_VIEW_URL} target="_blank" rel="noopener noreferrer">
              <FileSpreadsheet className="h-4 w-4" /> View Template
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={TEMPLATE_URL} download="brand-leads-template.csv">
              <Download className="h-4 w-4" /> Download CSV
            </a>
          </Button>
        </div>
      </div>

      {/* File upload area */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Upload your file</p>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className={`h-8 w-8 mx-auto mb-2 ${dragging ? 'text-primary' : 'text-muted-foreground/50'}`} />
          <p className="text-sm text-muted-foreground">
            {fileName || 'Drag & drop or click to select a CSV or Excel file'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Supports .csv, .xlsx, .xls
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      {parseError && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Table2 className="h-4 w-4" />
        <span>
          <span className="font-medium text-foreground">{fileRows.length}</span> data row{fileRows.length !== 1 ? 's' : ''} detected in{' '}
          <span className="font-medium text-foreground">{fileName}</span>
        </span>
      </div>

      {/* Mapping grid */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs font-medium text-muted-foreground pb-1 border-b sticky top-0 bg-background z-10">
          <span>File Column</span>
          <span />
          <span>Maps To</span>
        </div>
        {fileHeaders.map((header, idx) => {
          const currentField = columnMapping[idx];
          return (
            <div key={idx} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <div className="text-sm truncate font-medium" title={header}>
                {header || <span className="text-muted-foreground italic">empty</span>}
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <Select
                value={currentField}
                onValueChange={(val) => updateMapping(idx, val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__skip__">
                    <span className="text-muted-foreground">-- Skip --</span>
                  </SelectItem>
                  {DB_FIELDS.map((f) => {
                    const disabled = usedFields.has(f.value) && currentField !== f.value;
                    return (
                      <SelectItem
                        key={f.value}
                        value={f.value}
                        disabled={disabled}
                      >
                        {f.label}{f.required ? ' *' : ''}{disabled ? ' (used)' : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* Data preview */}
      {previewRows.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Preview (first {previewRows.length} row{previewRows.length !== 1 ? 's' : ''})</p>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  {fileHeaders.map((h, i) => {
                    const field = columnMapping[i];
                    if (field === '__skip__') return null;
                    const dbLabel = DB_FIELDS.find(f => f.value === field)?.label || h;
                    return (
                      <th key={i} className="px-2 py-1 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {dbLabel}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri} className="border-t">
                    {fileHeaders.map((_, ci) => {
                      if (columnMapping[ci] === '__skip__') return null;
                      return (
                        <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[150px] truncate">
                          {row[ci] || <span className="text-muted-foreground/40">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Validation error */}
      {mappingError && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{mappingError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setStep('upload'); setFileName(''); setFileHeaders([]); setFileRows([]); setParseError(''); if (fileRef.current) fileRef.current.value = ''; }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={goToOutreach} className="gap-1.5">
            Next <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOutreachStep = () => {
    const { valid } = buildLeads();
    return (
      <div className="space-y-5 pt-2">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="font-medium">{valid.length} lead{valid.length !== 1 ? 's' : ''} ready</span>
        </div>

        {/* Email outreach timing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Have you already emailed these leads?</p>
          </div>
          <RadioGroup value={outreachOption} onValueChange={(v) => setOutreachOption(v as typeof outreachOption)} className="gap-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="already" id="outreach-already" />
              <Label htmlFor="outreach-already" className="text-sm font-normal cursor-pointer">
                Yes, I already emailed them
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="today" id="outreach-today" />
              <Label htmlFor="outreach-today" className="text-sm font-normal cursor-pointer">
                I am emailing them today
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="planned" id="outreach-planned" className="mt-0.5" />
              <div className="space-y-2">
                <Label htmlFor="outreach-planned" className="text-sm font-normal cursor-pointer">
                  I am planning to email them on:
                </Label>
                {outreachOption === 'planned' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {plannedDate ? format(plannedDate, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={plannedDate}
                        onSelect={setPlannedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Follow-up reminder */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Set a follow-up reminder for phone outreach in:</p>
          <RadioGroup value={followUpOption} onValueChange={setFollowUpOption} className="gap-2">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {FOLLOW_UP_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`followup-${opt.value}`} />
                  <Label htmlFor={`followup-${opt.value}`} className="text-sm font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
            {followUpOption === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 w-fit">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {customFollowUpDate ? format(customFollowUpDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customFollowUpDate}
                    onSelect={setCustomFollowUpDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setStep('mapping')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || (outreachOption === 'planned' && !plannedDate)}
              className="gap-1.5"
            >
              {isLoading ? 'Importing...' : `Import ${valid.length} Lead${valid.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Step labels for dialog header
  // ---------------------------------------------------------------------------

  const stepConfig: Record<Step, { title: string; description: string; icon: React.ReactNode }> = {
    upload: {
      title: 'Bulk Import Leads',
      description: 'Upload a CSV or Excel file with your leads.',
      icon: <FileSpreadsheet className="h-5 w-5 text-primary" />,
    },
    mapping: {
      title: 'Map Columns',
      description: 'Match your file columns to the correct database fields.',
      icon: <Table2 className="h-5 w-5 text-primary" />,
    },
    outreach: {
      title: 'Email Outreach',
      description: 'Set outreach timing and follow-up reminders.',
      icon: <Mail className="h-5 w-5 text-primary" />,
    },
    importing: {
      title: 'Importing...',
      description: 'Your leads are being imported.',
      icon: <Upload className="h-5 w-5 text-primary animate-pulse" />,
    },
  };

  const currentStep = stepConfig[step];

  // Step indicator
  const stepIndex = step === 'upload' ? 0 : step === 'mapping' ? 1 : 2;
  const stepLabels = ['Upload', 'Map Columns', 'Outreach & Import'];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep.icon}
            {currentStep.title}
          </DialogTitle>
          <DialogDescription>
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 pb-1">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <div className="w-6 h-px bg-muted-foreground/20" />}
              <div
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors ${
                  i === stepIndex
                    ? 'bg-primary/10 text-primary font-medium'
                    : i < stepIndex
                      ? 'text-primary/60'
                      : 'text-muted-foreground/50'
                }`}
              >
                <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  i === stepIndex
                    ? 'bg-primary text-primary-foreground'
                    : i < stepIndex
                      ? 'bg-primary/30 text-primary'
                      : 'bg-muted-foreground/20 text-muted-foreground/50'
                }`}>
                  {i < stepIndex ? '\u2713' : i + 1}
                </span>
                {label}
              </div>
            </div>
          ))}
        </div>

        {step === 'upload' && renderUploadStep()}
        {step === 'mapping' && renderMappingStep()}
        {(step === 'outreach' || step === 'importing') && renderOutreachStep()}
      </DialogContent>
    </Dialog>
  );
};
