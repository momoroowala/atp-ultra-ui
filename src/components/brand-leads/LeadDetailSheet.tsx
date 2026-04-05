import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BrandLead, BrandLeadUpdate, LEAD_CATEGORIES, LEAD_STATUSES, BUSINESS_MODELS, US_STATES } from '@/hooks/useBrandLeads';
import { Trash2 } from 'lucide-react';

interface LeadDetailSheetProps {
  lead: BrandLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: BrandLeadUpdate) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
}

export const LeadDetailSheet = ({ lead, open, onOpenChange, onUpdate, onDelete, isUpdating }: LeadDetailSheetProps) => {
  const [form, setForm] = useState({
    company_brand_name: '',
    category: '',
    business_model: 'Brand',
    website: '',
    amazon_lead_product_url: '',
    contact_name: '',
    email: '',
    phone: '',
    state: '',
    status: 'Email Sent',
    last_email_sent_date: '',
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setForm({
        company_brand_name: lead.company_brand_name,
        category: lead.category || '',
        business_model: lead.business_model,
        website: lead.website || '',
        amazon_lead_product_url: lead.amazon_lead_product_url || '',
        contact_name: lead.contact_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        state: lead.state || '',
        status: lead.status,
        last_email_sent_date: lead.last_email_sent_date || '',
        notes: lead.notes || '',
      });
    }
  }, [lead]);

  const handleSave = () => {
    if (!lead) return;
    onUpdate(lead.id, {
      company_brand_name: form.company_brand_name.trim(),
      category: form.category || null,
      business_model: form.business_model,
      website: form.website || null,
      amazon_lead_product_url: form.amazon_lead_product_url || null,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      state: form.state || null,
      status: form.status,
      last_email_sent_date: form.last_email_sent_date || null,
      notes: form.notes || null,
    });
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit Lead</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          {/* Brand Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Brand Info</h4>
            <div>
              <Label>Company / Brand Name *</Label>
              <Input value={form.company_brand_name} onChange={e => setForm(p => ({ ...p, company_brand_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{LEAD_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Business Model</Label>
                <Select value={form.business_model} onValueChange={v => setForm(p => ({ ...p, business_model: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BUSINESS_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
            </div>
            <div>
              <Label>Amazon Lead Product URL</Label>
              <Input value={form.amazon_lead_product_url} onChange={e => setForm(p => ({ ...p, amazon_lead_product_url: e.target.value }))} />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Contact Info</h4>
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>State</Label>
              <Select value={form.state} onValueChange={v => setForm(p => ({ ...p, state: v }))}>
                <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
                <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Outreach */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Outreach</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Last Email Sent</Label>
                <Input type="date" value={form.last_email_sent_date} onChange={e => setForm(p => ({ ...p, last_email_sent_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1" disabled={isUpdating || !form.company_brand_name.trim()}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{lead.company_brand_name}". This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { onDelete(lead.id); onOpenChange(false); }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
