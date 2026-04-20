import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LEAD_CATEGORIES, LEAD_STATUSES, BUSINESS_MODELS, US_STATES, BrandLeadInsert } from '@/hooks/useBrandLeads';
import { useAuth } from '@/hooks/useAuth';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (lead: BrandLeadInsert) => void;
  isLoading?: boolean;
}

export const AddLeadDialog = ({ open, onOpenChange, onSubmit, isLoading }: AddLeadDialogProps) => {
  const { user } = useAuth();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !form.company_brand_name.trim()) return;
    onSubmit({
      user_id: user.id,
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
    setForm({
      company_brand_name: '', category: '', business_model: 'Brand', website: '',
      amazon_lead_product_url: '', contact_name: '', email: '', phone: '',
      state: '', status: 'Email Sent', last_email_sent_date: '', notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Brand Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Brand Info</h4>
            <div>
              <Label htmlFor="company_brand_name">Company / Brand Name *</Label>
              <Input id="company_brand_name" value={form.company_brand_name} onChange={e => setForm(p => ({ ...p, company_brand_name: e.target.value }))} required />
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
              <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Amazon Lead Product URL</Label>
              <Input value={form.amazon_lead_product_url} onChange={e => setForm(p => ({ ...p, amazon_lead_product_url: e.target.value }))} placeholder="https://amazon.com/..." />
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

          <Button type="submit" className="w-full" disabled={isLoading || !form.company_brand_name.trim()}>
            {isLoading ? 'Adding...' : 'Add Lead'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
