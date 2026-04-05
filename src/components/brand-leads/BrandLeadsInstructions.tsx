import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BrandLeadsInstructions = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>How to Use Brand Leads</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="font-semibold text-foreground">Getting Started</p>
          <p>Use this brand list to reach out to brands and distributors. We've included field descriptions below to help you format your entries.</p>
          <p className="font-medium text-foreground">Finding Brands with SmartScout:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Amazon in stock rate 30-50%</li>
            <li>3+ Amazon FBA Sellers</li>
            <li>Brand: Less than $500,000 MRR (Monthly Recurring Revenue)</li>
          </ul>
        </div>
        <p><strong className="text-foreground">Company/Brand Name</strong> — The name of the brand you're reaching out to.</p>
        <p><strong className="text-foreground">Category</strong> — The Amazon product category the brand falls under.</p>
        <p><strong className="text-foreground">Contact Name</strong> — The decision-maker or point of contact at the brand.</p>
        <p><strong className="text-foreground">Email & Phone</strong> — Contact information for outreach.</p>
        <p><strong className="text-foreground">State</strong> — The US state where the brand is headquartered.</p>
        <p><strong className="text-foreground">Status</strong> — Track your outreach progress:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-blue-600 font-medium">Email Sent</span> — Initial email sent</li>
          <li><span className="text-yellow-600 font-medium">2 Email Sent</span> — Follow-up email sent</li>
          <li><span className="text-purple-600 font-medium">Phone Call</span> — Phone outreach made</li>
          <li><span className="text-green-600 font-medium">Approved</span> — Brand approved for partnership</li>
          <li><span className="text-red-600 font-medium">Not Approved</span> — Brand declined</li>
        </ul>
        <p><strong className="text-foreground">Last Email Sent Date</strong> — When you last contacted the brand.</p>
        <p><strong className="text-foreground">Amazon Lead Product URL</strong> — Link to the brand's product listing on Amazon.</p>
        <p><strong className="text-foreground">Notes</strong> — Any additional details about the lead or conversation.</p>
      </div>
    </DialogContent>
  </Dialog>
);
