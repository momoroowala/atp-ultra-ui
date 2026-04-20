import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { BrandLeadInsert } from '@/hooks/useBrandLeads';

const TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/19KjRyjR89hft9dGnE6a-vSTtIxzJH-Byqp9cHlh_tvg/export?format=csv&gid=380864053';
const TEMPLATE_VIEW_URL = 'https://docs.google.com/spreadsheets/d/19KjRyjR89hft9dGnE6a-vSTtIxzJH-Byqp9cHlh_tvg/edit?gid=380864053#gid=380864053';

const HEADER_MAP: Record<string, keyof Omit<BrandLeadInsert, 'user_id'>> = {
  'company brand name': 'company_brand_name',
  'category': 'category',
  'contact name': 'contact_name',
  'email address': 'email',
  'phone#': 'phone',
  'phone': 'phone',
  'last email sent date': 'last_email_sent_date',
  'status': 'status',
  'business model': 'business_model',
  'website': 'website',
  'state': 'state',
  'amazon lead product': 'amazon_lead_product_url',
  'amazon lead product url': 'amazon_lead_product_url',
  'notes': 'notes',
};

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

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: Omit<BrandLeadInsert, 'user_id'>[]) => void;
  isLoading: boolean;
}

export const BulkImportDialog = ({ open, onOpenChange, onImport, isLoading }: BulkImportDialogProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ valid: Omit<BrandLeadInsert, 'user_id'>[]; errors: string[] } | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setParsed(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = splitCSVRows(text);
      if (lines.length < 2) {
        setParsed({ valid: [], errors: ['File appears empty or has no data rows.'] });
        return;
      }

      // Find the header row — first row that contains "Company Brand Name" (case-insensitive)
      let headerIdx = -1;
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        if (lines[i].toLowerCase().includes('company brand name')) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) {
        setParsed({ valid: [], errors: ['Could not find header row with "Company Brand Name". Make sure you\'re using the correct template.'] });
        return;
      }

      const headers = parseCSVLine(lines[headerIdx]).map(h => h.toLowerCase().trim());
      const colMap: (keyof Omit<BrandLeadInsert, 'user_id'> | null)[] = headers.map(h => HEADER_MAP[h] || null);

      const valid: Omit<BrandLeadInsert, 'user_id'>[] = [];
      const errors: string[] = [];

      for (let i = headerIdx + 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        colMap.forEach((field, ci) => {
          if (field && cols[ci]) row[field] = cols[ci];
        });

        if (!row.company_brand_name) {
          if (Object.values(row).some(v => v)) {
            errors.push(`Row ${i + 1}: Missing company/brand name — skipped.`);
          }
          continue;
        }

        valid.push({
          company_brand_name: row.company_brand_name,
          category: row.category || null,
          contact_name: row.contact_name || null,
          email: row.email || null,
          phone: row.phone || null,
          last_email_sent_date: normalizeDate(row.last_email_sent_date || '') || null,
          status: row.status || 'Email Sent',
          business_model: row.business_model || 'Brand',
          website: row.website || null,
          state: row.state || null,
          amazon_lead_product_url: row.amazon_lead_product_url || null,
          notes: row.notes || null,
        });
      }

      setParsed({ valid, errors });
    };
    reader.readAsText(file);
  };

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

  const handleImport = () => {
    if (!parsed?.valid.length) return;
    onImport(parsed.valid);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Import Leads
          </DialogTitle>
          <DialogDescription>
            Download the template, fill in your leads, export as CSV, and upload it here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Step 1: Template */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Step 1: Download Template</p>
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

          {/* Step 2: Upload */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Step 2: Upload Filled CSV</p>
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
                {fileName || 'Drag & drop or click to select a CSV file'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>

          {/* Results */}
          {parsed && (
            <div className="space-y-2">
              {parsed.valid.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{parsed.valid.length} lead{parsed.valid.length !== 1 ? 's' : ''} ready to import</span>
                </div>
              )}
              {parsed.errors.length > 0 && (
                <div className="rounded-md bg-destructive/10 p-3 space-y-1 max-h-32 overflow-y-auto">
                  {parsed.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
              {parsed.valid.length === 0 && parsed.errors.length === 0 && (
                <p className="text-sm text-muted-foreground">No valid leads found in the file.</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsed?.valid.length || isLoading}
              className="gap-1.5"
            >
              {isLoading ? 'Importing...' : `Import ${parsed?.valid.length || 0} Leads`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
