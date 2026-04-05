import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCourseAccessManager } from "./UserCourseAccessManager";
import { Course } from "@/hooks/useCourses";
import { useTiers } from "@/hooks/useTiers";

interface CourseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (course: Partial<Course>) => void;
  course?: Course | null;
}

export const CourseDialog = ({ open, onClose, onSave, course }: CourseDialogProps) => {
  const { data: tiers = [], isLoading: tiersLoading } = useTiers();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    course_order: 1,
    upsell_funnel_url: '',
    visible_tier_ids: [] as string[],
    catalog_visible_tier_ids: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        thumbnail_url: course.thumbnail_url || '',
        course_order: course.course_order || 1,
        upsell_funnel_url: (course as any).upsell_funnel_url || '',
        visible_tier_ids: course.visible_tier_ids || [],
        catalog_visible_tier_ids: course.catalog_visible_tier_ids || [],
        is_active: course.is_active ?? true,
      });
    } else {
      // Find the "all" tier ID for default selection
      const allTier = tiers.find(t => t.tier_key === 'all');
      setFormData({
        title: '',
        description: '',
        thumbnail_url: '',
        course_order: 1,
        upsell_funnel_url: '',
        visible_tier_ids: allTier ? [allTier.id] : [],
        catalog_visible_tier_ids: allTier ? [allTier.id] : [],
        is_active: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure boolean, never null/undefined
    onSave({ ...formData, is_active: formData.is_active === true });
  };

  const toggleTier = (tierId: string) => {
    setFormData(prev => {
      const currentTierIds = prev.visible_tier_ids || [];
      if (currentTierIds.includes(tierId)) {
        return {
          ...prev,
          visible_tier_ids: currentTierIds.filter(id => id !== tierId),
        };
      } else {
        return {
          ...prev,
          visible_tier_ids: [...currentTierIds, tierId],
        };
      }
    });
  };

  const toggleCatalogVisibility = (tierId: string) => {
    setFormData(prev => {
      const currentTierIds = prev.catalog_visible_tier_ids || [];
      if (currentTierIds.includes(tierId)) {
        return {
          ...prev,
          catalog_visible_tier_ids: currentTierIds.filter(id => id !== tierId),
        };
      } else {
        return {
          ...prev,
          catalog_visible_tier_ids: [...currentTierIds, tierId],
        };
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{course ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            <DialogDescription>
              {course ? 'Update course details and manage access' : 'Fill in the details for the new course'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="my-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="access" disabled={!course}>User Access</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 max-h-[calc(90vh-250px)] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="course_order">Display Order *</Label>
                <Input
                  id="course_order"
                  type="number"
                  value={formData.course_order}
                  onChange={(e) => setFormData({ ...formData, course_order: parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="upsell_funnel_url">Course Upsell URL</Label>
                <Input
                  id="upsell_funnel_url"
                  value={formData.upsell_funnel_url}
                  onChange={(e) => setFormData({ ...formData, upsell_funnel_url: e.target.value })}
                  placeholder="https://example.com/upgrade"
                />
              </div>

              <div>
                <Label className="mb-3 block">Tier Access</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select which tiers automatically have access to this course. Individual users can also be granted access manually in the User Access tab.
                </p>
                <div className="space-y-2">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tier-${tier.id}`}
                        checked={formData.visible_tier_ids.includes(tier.id)}
                        onCheckedChange={() => toggleTier(tier.id)}
                      />
                      <Label htmlFor={`tier-${tier.id}`} className="font-normal">
                        {tier.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Tier Visibility</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select which tiers can see this course in the course catalog.
                </p>
                <div className="space-y-2">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`catalog-tier-${tier.id}`}
                        checked={formData.catalog_visible_tier_ids.includes(tier.id)}
                        onCheckedChange={() => toggleCatalogVisibility(tier.id)}
                      />
                      <Label htmlFor={`catalog-tier-${tier.id}`} className="font-normal">
                        {tier.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active === true}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked === true }))
                  }
                />
                <Label htmlFor="is_active" className="font-normal">
                  Active (visible to users)
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="access" className="max-h-[calc(90vh-250px)] overflow-y-auto">
              {course && <UserCourseAccessManager courseId={course.id} />}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {course ? 'Update Course' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
