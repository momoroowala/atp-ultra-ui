import { useState } from 'react';
import { useAllTiers } from '@/hooks/useTiers';
import { useAdminCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { Tier } from '@/hooks/useTiers';

const ALWAYS_ON_PAGES = ['home', 'support'];
const CLIENT_ROLE_DEFAULTS: Record<string, boolean> = {
  home: true, courses: true, my_plan: true, calendar: true,
  community: true, one_on_ones: false, support: true, brand_leads: false,
};

const getDefaultPageVisibility = (): Record<string, boolean> => {
  const pv = { ...CLIENT_ROLE_DEFAULTS };
  ALWAYS_ON_PAGES.forEach(k => pv[k] = true);
  return pv;
};

const mergePageVisibility = (tierPV: Record<string, boolean | undefined> | null | undefined): Record<string, boolean> => {
  const merged: Record<string, boolean> = {};
  for (const key of Object.keys(CLIENT_ROLE_DEFAULTS)) {
    merged[key] = (tierPV?.[key] as boolean | undefined) ?? CLIENT_ROLE_DEFAULTS[key];
  }
  ALWAYS_ON_PAGES.forEach(k => merged[k] = true);
  return merged;
};

const forceAlwaysOnPages = (pv: Record<string, boolean>): Record<string, boolean> => {
  const result = { ...pv };
  ALWAYS_ON_PAGES.forEach(k => result[k] = true);
  return result;
};

export const TierManagementTab = () => {
  const { data: tiers = [], isLoading, createTier, createTierAsync, updateTier, deleteTier, isCreating, isUpdating, isDeleting } = useAllTiers();
  const { courses } = useAdminCourses();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    tier_key: '',
    display_name: '',
    description: '',
    is_active: true,
    tier_order: 0,
    upsell_funnel_url: '',
    feature_access: {},
    feature_visibility: {
      crisp_chat_visible: true,
    },
    page_visibility: getDefaultPageVisibility(),
  });

  const PAGE_VISIBILITY_OPTIONS = [
    { key: 'home', label: 'Home', description: 'Main dashboard page' },
    { key: 'courses', label: 'Courses', description: 'Course catalog and learning content' },
    { key: 'my_plan', label: 'My Roadmap', description: 'Personal learning roadmap and tasks' },
    { key: 'calendar', label: 'Calendar', description: 'Calls and recordings calendar' },
    { key: 'community', label: 'Community', description: 'Community channels and chat' },
    { key: 'one_on_ones', label: 'Direct Messages', description: 'Direct messages with coaches' },
    { key: 'support', label: 'Support', description: 'Help and support page' },
    { key: 'brand_leads', label: 'Brand Leads', description: 'Brand outreach tracker' },
  ];

  const handleCreate = async () => {
    try {
      const result = await createTierAsync({ ...formData, page_visibility: forceAlwaysOnPages(formData.page_visibility) } as any);

      // Update course access for selected courses
      if (selectedCourseIds.length > 0 && result?.id) {
        await updateCourseAccess(result.id);
      }
      
      setIsCreateDialogOpen(false);
      setFormData({
        tier_key: '',
        display_name: '',
        description: '',
        is_active: true,
        tier_order: tiers.length,
        upsell_funnel_url: '',
        feature_access: {},
        feature_visibility: {
          crisp_chat_visible: true,
        },
        page_visibility: getDefaultPageVisibility(),
      });
      setSelectedCourseIds([]);
      setCourseSearchTerm("");
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const handleEdit = async () => {
    if (!selectedTier) return;
    updateTier({ id: selectedTier.id, updates: { ...formData, page_visibility: forceAlwaysOnPages(formData.page_visibility) } as any }, {
      onSuccess: async () => {
        // Update course access
        await updateCourseAccess(selectedTier.id);
        
        setIsEditDialogOpen(false);
        setSelectedTier(null);
        setSelectedCourseIds([]);
        setCourseSearchTerm("");
      },
    });
  };

  const handleDelete = () => {
    if (!selectedTier) return;
    deleteTier(selectedTier.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedTier(null);
      },
    });
  };

  const openEditDialog = async (tier: Tier) => {
    setSelectedTier(tier);
    setFormData({
      tier_key: tier.tier_key,
      display_name: tier.display_name,
      description: tier.description || '',
      is_active: tier.is_active,
      tier_order: tier.tier_order,
      upsell_funnel_url: tier.upsell_funnel_url || '',
      feature_access: {
        ...(tier.feature_access || {}),
      },
      feature_visibility: {
        crisp_chat_visible: tier.feature_visibility?.crisp_chat_visible ?? true,
      },
      page_visibility: mergePageVisibility(tier.page_visibility as Record<string, boolean | undefined> | null),
    });

    // Load courses that have this tier
    const { data: coursesWithTier } = await supabase
      .from('courses')
      .select('id')
      .contains('visible_tier_ids', [tier.id]);
    
    setSelectedCourseIds(coursesWithTier?.map(c => c.id) || []);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (tier: Tier) => {
    setSelectedTier(tier);
    setIsDeleteDialogOpen(true);
  };

  const updateCourseAccess = async (tierId: string) => {
    if (!courses) return;

    const updates = courses.map(async (course) => {
      const currentTierIds = course.visible_tier_ids || [];
      const shouldHaveAccess = selectedCourseIds.includes(course.id);
      const hasAccess = currentTierIds.includes(tierId);

      // Only update if there's a change
      if (shouldHaveAccess === hasAccess) return;

      let newTierIds = [...currentTierIds];
      if (shouldHaveAccess) {
        newTierIds.push(tierId);
      } else {
        newTierIds = newTierIds.filter(id => id !== tierId);
      }

      return supabase
        .from('courses')
        .update({ visible_tier_ids: newTierIds })
        .eq('id', course.id);
    });

    await Promise.all(updates);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Tier Management</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage user tiers and their visibility across the platform
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Create Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Key</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-mono text-sm">{tier.tier_key}</TableCell>
                  <TableCell className="font-medium">{tier.display_name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {tier.description || '-'}
                  </TableCell>
                  <TableCell>{tier.tier_order}</TableCell>
                  <TableCell>
                    <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(tier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(tier)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Tier</DialogTitle>
            <DialogDescription>
              Add a new tier with specific feature access and course visibility
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Tier Details</TabsTrigger>
              <TabsTrigger value="pages">Page Visibility</TabsTrigger>
              <TabsTrigger value="courses">Course Access</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tier_key">Tier Key*</Label>
                    <Input
                      id="tier_key"
                      placeholder="e.g., client_enterprise"
                      value={formData.tier_key}
                      onChange={(e) => setFormData({ ...formData, tier_key: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lowercase, underscores only. Used in code and database.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="display_name">Display Name*</Label>
                    <Input
                      id="display_name"
                      placeholder="e.g., Enterprise Client"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description of this tier"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier_order">Display Order</Label>
                    <Input
                      id="tier_order"
                      type="number"
                      value={formData.tier_order}
                      onChange={(e) => setFormData({ ...formData, tier_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">Page Visibility</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Control which pages are visible in the sidebar for users in this tier
                  </p>
                </div>
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  <div className="space-y-3">
                    {PAGE_VISIBILITY_OPTIONS.map((page) => {
                      const isAlwaysOn = ALWAYS_ON_PAGES.includes(page.key);
                      return (
                        <div key={page.key} className={`flex items-center justify-between p-3 rounded-md hover:bg-accent/50 ${isAlwaysOn ? 'opacity-70' : ''}`}>
                          <div className="space-y-1">
                            <Label htmlFor={`create-page-${page.key}`} className="cursor-pointer font-medium">
                              {page.label}
                              {isAlwaysOn && <span className="text-xs text-muted-foreground ml-2">(always on)</span>}
                            </Label>
                            <p className="text-xs text-muted-foreground">{page.description}</p>
                          </div>
                          <Switch
                            id={`create-page-${page.key}`}
                            disabled={isAlwaysOn}
                            checked={formData.page_visibility[page.key] ?? false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                page_visibility: { ...formData.page_visibility, [page.key]: checked },
                              })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label>Course Access</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select which courses are visible to users in this tier
                  </p>
                </div>
                
                <Input
                  placeholder="Search courses..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                />

                <ScrollArea className="h-[400px] border rounded-md p-4">
                  <div className="space-y-3">
                    {filteredCourses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No courses found
                      </p>
                    ) : (
                      filteredCourses.map((course) => (
                        <div key={course.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent/50">
                          <Checkbox
                            id={`create-course-${course.id}`}
                            checked={selectedCourseIds.includes(course.id)}
                            onCheckedChange={() => toggleCourse(course.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={`create-course-${course.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {course.title}
                              {!course.is_active && (
                                <Badge variant="secondary" className="ml-2">
                                  Inactive
                                </Badge>
                              )}
                            </Label>
                            {course.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setSelectedCourseIds([]);
              setCourseSearchTerm("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !formData.tier_key || !formData.display_name}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Tier</DialogTitle>
            <DialogDescription>
              Update tier details, feature access, and course visibility
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Tier Details</TabsTrigger>
              <TabsTrigger value="pages">Page Visibility</TabsTrigger>
              <TabsTrigger value="courses">Course Access</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-4">
                  {selectedTier && (
                    <div>
                      <Label>Tier ID</Label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTier.id);
                          toast.success('Tier ID copied to clipboard');
                        }}
                        className="flex items-center gap-2 text-sm text-primary hover:underline font-mono mt-1 group"
                      >
                        {selectedTier.id}
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="edit_tier_key">Tier Key*</Label>
                    <Input
                      id="edit_tier_key"
                      value={formData.tier_key}
                      onChange={(e) => setFormData({ ...formData, tier_key: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_display_name">Display Name*</Label>
                    <Input
                      id="edit_display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_description">Description</Label>
                    <Textarea
                      id="edit_description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_tier_order">Display Order</Label>
                    <Input
                      id="edit_tier_order"
                      type="number"
                      value={formData.tier_order}
                      onChange={(e) => setFormData({ ...formData, tier_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="edit_is_active">Active</Label>
                  </div>
                  

                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">Page Visibility</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Control which pages are visible in the sidebar for users in this tier
                  </p>
                </div>
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  <div className="space-y-3">
                    {PAGE_VISIBILITY_OPTIONS.map((page) => {
                      const isAlwaysOn = ALWAYS_ON_PAGES.includes(page.key);
                      return (
                        <div key={page.key} className={`flex items-center justify-between p-3 rounded-md hover:bg-accent/50 ${isAlwaysOn ? 'opacity-70' : ''}`}>
                          <div className="space-y-1">
                            <Label htmlFor={`edit-page-${page.key}`} className="cursor-pointer font-medium">
                              {page.label}
                              {isAlwaysOn && <span className="text-xs text-muted-foreground ml-2">(always on)</span>}
                            </Label>
                            <p className="text-xs text-muted-foreground">{page.description}</p>
                          </div>
                          <Switch
                            id={`edit-page-${page.key}`}
                            disabled={isAlwaysOn}
                            checked={formData.page_visibility[page.key] ?? false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                page_visibility: { ...formData.page_visibility, [page.key]: checked },
                              })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label>Course Access</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select which courses are visible to users in this tier
                  </p>
                </div>
                
                <Input
                  placeholder="Search courses..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                />

                <ScrollArea className="h-[400px] border rounded-md p-4">
                  <div className="space-y-3">
                    {filteredCourses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No courses found
                      </p>
                    ) : (
                      filteredCourses.map((course) => (
                        <div key={course.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent/50">
                          <Checkbox
                            id={`edit-course-${course.id}`}
                            checked={selectedCourseIds.includes(course.id)}
                            onCheckedChange={() => toggleCourse(course.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={`edit-course-${course.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {course.title}
                              {!course.is_active && (
                                <Badge variant="secondary" className="ml-2">
                                  Inactive
                                </Badge>
                              )}
                            </Label>
                            {course.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedCourseIds([]);
              setCourseSearchTerm("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isUpdating || !formData.tier_key || !formData.display_name}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tier "{selectedTier?.display_name}"? This action cannot be undone.
              Users and content assigned to this tier may lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
