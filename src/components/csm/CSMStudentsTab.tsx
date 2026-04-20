import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCSMStudents, useCSMList } from '@/hooks/useCSMStudents';
import { useTiers } from '@/hooks/useTiers';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast as sonnerToast } from 'sonner';
import type { CSMStudent } from '@/hooks/useCSMStudents';

interface CSMStudentsTabProps {
  onViewStudentDetails?: (userId: string) => void;
}

export function CSMStudentsTab({ onViewStudentDetails }: CSMStudentsTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [csmFilter, setCsmFilter] = useState<string>(user?.id || '');
  const [editingRevenueUserId, setEditingRevenueUserId] = useState<string | null>(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: rawStudents = [], isLoading: studentsLoading } = useCSMStudents(csmFilter);
  const { data: tiers = [] } = useTiers();
  const { data: csmList = [] } = useCSMList();

  // Demo students fallback
  const students: CSMStudent[] = useMemo(() => {
    if (rawStudents.length > 0) return rawStudents;
    const names = [
      ['Sarah','Chen'],['Marcus','Rivera'],['Jordan','Williams'],['Priya','Patel'],['Tyler','Brooks'],
      ['Aisha','Johnson'],['David','Kim'],['Emma','Thompson'],['Alex','Morgan'],['Nina','Sato'],
      ['Liam','Garcia'],['Sophia','Martinez'],['Ethan','Lee'],['Olivia','Brown'],['Mason','Taylor'],
      ['Isabella','Anderson'],['Logan','Thomas'],['Mia','Jackson'],['James','White'],['Ava','Wilson'],
      ['Benjamin','Harris'],['Charlotte','Clark'],['Jacob','Lewis'],['Amelia','Robinson'],['Michael','Walker'],
      ['Harper','Hall'],['Daniel','Allen'],['Evelyn','Young'],['Sebastian','King'],['Abigail','Wright'],
      ['Henry','Lopez'],['Emily','Hill'],['Owen','Scott'],['Ella','Green'],['Jack','Adams'],
      ['Scarlett','Baker'],['Lucas','Nelson'],['Grace','Carter'],['Aiden','Mitchell'],['Chloe','Roberts'],
      ['Samuel','Turner'],['Zoey','Phillips'],['Joseph','Campbell'],['Lily','Parker'],['John','Evans'],
      ['Hannah','Edwards'],['Ryan','Stewart'],['Aria','Collins'],['Luke','Morris'],['Riley','Murphy'],
    ];
    const tierKeys = ['stb','stb','stb','elite','elite','elite','ultimate','ultimate','platinum','platinum','stb','stb','elite','stb','stb','ultimate','stb','elite','stb','platinum','stb','stb','elite','stb','ultimate','stb','stb','elite','stb','stb','stb','elite','stb','stb','ultimate','stb','stb','elite','stb','stb','stb','elite','stb','stb','stb','stb','elite','stb','stb','stb'];
    const now = Date.now();
    const day = 86400000;
    return names.map(([fn, ln], i): CSMStudent => {
      const daysAgo = i < 5 ? Math.floor(Math.random() * 3) : i < 15 ? Math.floor(Math.random() * 7) : i < 30 ? Math.floor(Math.random() * 20) + 7 : i < 40 ? Math.floor(Math.random() * 60) + 14 : null;
      const totalTasks = 16;
      const prog = daysAgo === null ? 0 : daysAgo < 3 ? 40 + Math.floor(Math.random() * 60) : daysAgo < 7 ? 20 + Math.floor(Math.random() * 50) : Math.floor(Math.random() * 30);
      return {
        id: `demo-student-${i}`,
        firstName: fn,
        lastName: ln,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.dev`,
        tier: (tierKeys[i] || 'stb').toUpperCase(),
        tierId: `tier-${tierKeys[i]}`,
        assignedCsmId: 'demo-admin-001',
        isActive: daysAgo !== null && daysAgo < 30,
        completedTasks: Math.round(totalTasks * prog / 100),
        totalTasks,
        progressPercentage: prog,
        lastSignInAt: daysAgo !== null ? new Date(now - daysAgo * day).toISOString() : null,
        createdAt: new Date(now - (60 + i * 2) * day).toISOString(),
        onboardingBookingStatus: i < 20 ? 'completed' : i < 35 ? 'not_started' : 'missed',
        onboardingDate: i < 20 ? new Date(now - (50 + i) * day).toISOString() : null,
        offboardingDate: null,
        guaranteeStatus: i < 15 ? 'met' : i < 25 ? 'pending' : 'activated',
        revenue: Math.floor(Math.random() * 15000),
      };
    });
  }, [rawStudents]);

  const getStatus = (s: CSMStudent) => {
    if (!s.isActive) return 'Refunded';
    if (!s.lastSignInAt) return 'Never Logged In';
    const daysSince = differenceInDays(new Date(), new Date(s.lastSignInAt));
    return daysSince > 14 ? 'At Risk' : 'Active';
  };

  const filteredStudents = students.filter(student => {
    const matchesTier = tierFilter === 'all' || student.tierId === tierFilter;
    const matchesStatus = statusFilter === 'all' || getStatus(student) === statusFilter;
    return matchesTier && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Never Logged In': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'At Risk': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Refunded': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return '';
    }
  };
  const getOnboardingStatus = (s: CSMStudent) => {
    const st = s.onboardingBookingStatus;
    if (st === 'completed') return 'Completed';
    if (st === 'missed') return 'Missed';
    if (st === 'rescheduled') return 'Rescheduled';
    return 'Not Started';
  };
  const getOnboardingStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Missed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Not Started': return 'bg-muted text-muted-foreground';
      default: return '';
    }
  };
  const getGuaranteeStyle = (status: string) => {
    switch (status) {
      case 'met': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'activated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'voided': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const handleSaveRevenue = async (userId: string, value: string) => {
    try {
      const numVal = value ? Number(value) : null;
      const { error } = await supabase.from('user_profiles').update({ revenue: numVal } as any).eq('id', userId);
      if (error) throw error;
      sonnerToast.success('Revenue updated');
      queryClient.invalidateQueries({ queryKey: ['all-users-progress'] });
    } catch (err: any) {
      sonnerToast.error(err.message || 'Failed to update revenue');
    }
    setEditingRevenueUserId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={csmFilter} onValueChange={setCsmFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by CSM" />
          </SelectTrigger>
          <SelectContent>
            {user && <SelectItem value={user.id}>My Students</SelectItem>}
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {csmList.filter(c => c.id !== user?.id).map(csm => (
              <SelectItem key={csm.id} value={csm.id}>
                {csm.firstName} {csm.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {tiers.filter(t => t.tier_key !== 'staff').map(t => (
              <SelectItem key={t.id} value={t.id}>{t.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Never Logged In">Never Logged In</SelectItem>
            <SelectItem value="At Risk">At Risk</SelectItem>
            <SelectItem value="Refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="border rounded-lg text-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 py-2">Name</TableHead>
              <TableHead className="px-2 py-2">Tier</TableHead>
              <TableHead className="px-2 py-2">Status</TableHead>
              <TableHead className="px-2 py-2">Onboarding</TableHead>
              <TableHead className="px-2 py-2">Onboard Date</TableHead>
              <TableHead className="px-2 py-2">Offboard Date</TableHead>
              <TableHead className="px-2 py-2">Guarantee</TableHead>
              <TableHead className="px-2 py-2">Revenue</TableHead>
              <TableHead className="px-2 py-2">Progress</TableHead>
              <TableHead className="px-2 py-2">Last Seen</TableHead>
              <TableHead className="px-2 py-2">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 11 }).map((_, j) => (
                    <TableCell key={j} className="px-2 py-2"><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map(student => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewStudentDetails?.(student.id)}
                >
                  <TableCell className="px-2 py-2 font-medium max-w-[140px]">
                    <span
                      className="cursor-pointer hover:underline text-foreground font-medium truncate block"
                      onClick={(e) => { e.stopPropagation(); navigate('/csm-panel', { state: { viewStudentId: student.id, activeTab: 'students' } }); }}
                    >
                      {student.firstName} {student.lastName}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <Badge variant="outline" className="whitespace-nowrap text-[11px]">{student.tier}</Badge>
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    {(() => {
                      const status = getStatus(student);
                      return <Badge variant="secondary" className={cn("whitespace-nowrap text-[11px]", getStatusStyle(status))}>{status}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    {(() => {
                      const obs = getOnboardingStatus(student);
                      return <Badge variant="secondary" className={cn("whitespace-nowrap text-[11px]", getOnboardingStyle(obs))}>{obs}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                    {student.onboardingDate ? format(new Date(student.onboardingDate), 'MM/dd/yy') : '—'}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                    {student.offboardingDate ? format(new Date(student.offboardingDate), 'MM/dd/yy') : '—'}
                  </TableCell>
                  <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <Select
                      value={student.guaranteeStatus || 'pending'}
                      onValueChange={async (val) => {
                        try {
                          const { error } = await supabase.from('user_profiles').update({ guarantee_status: val } as any).eq('id', student.id);
                          if (error) throw error;
                          sonnerToast.success('Guarantee status updated');
                          queryClient.invalidateQueries({ queryKey: ['all-users-progress'] });
                        } catch (err: any) {
                          sonnerToast.error(err.message || 'Failed to update guarantee status');
                        }
                      }}
                    >
                      <SelectTrigger className="w-[110px] h-7 text-[11px] border-0 bg-transparent p-0 shadow-none focus:ring-0 group/guarantee">
                        <Badge variant="secondary" className={cn("whitespace-nowrap text-[11px] capitalize cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all", getGuaranteeStyle(student.guaranteeStatus || 'pending'))}>
                          {student.guaranteeStatus || 'pending'}
                          <Pencil className="h-2.5 w-2.5 ml-1 text-muted-foreground/0 group-hover/guarantee:text-muted-foreground/70 transition-colors" />
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="met">Met</SelectItem>
                        <SelectItem value="activated">Activated</SelectItem>
                        <SelectItem value="voided">Voided</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    {editingRevenueUserId === student.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[11px]">$</span>
                        <Input
                          type="number"
                          className="h-7 w-20 text-[11px] px-1.5"
                          value={editingRevenueValue}
                          onChange={e => setEditingRevenueValue(e.target.value)}
                          onBlur={() => handleSaveRevenue(student.id, editingRevenueValue)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveRevenue(student.id, editingRevenueValue);
                            if (e.key === 'Escape') setEditingRevenueUserId(null);
                          }}
                          autoFocus
                          min="0"
                        />
                      </div>
                    ) : (
                      <button
                        className="text-[11px] whitespace-nowrap text-foreground flex items-center gap-1 cursor-pointer group/revenue"
                        onClick={() => {
                          setEditingRevenueUserId(student.id);
                          setEditingRevenueValue(student.revenue != null ? String(student.revenue) : '');
                        }}
                      >
                        {student.revenue != null ? formatCurrency(student.revenue) : '—'}
                        <Pencil className="h-2.5 w-2.5 text-muted-foreground/0 group-hover/revenue:text-muted-foreground/70 transition-colors" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <Progress value={student.progressPercentage} className="h-1.5 w-14" />
                      <span className="font-medium whitespace-nowrap">{student.progressPercentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                    {student.lastSignInAt ? format(new Date(student.lastSignInAt), 'MM/dd/yy') : 'Never'}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                    {student.createdAt ? format(new Date(student.createdAt), 'MM/dd/yy') : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
