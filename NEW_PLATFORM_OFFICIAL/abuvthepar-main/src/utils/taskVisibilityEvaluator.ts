export interface VisibilityCondition {
  field_id: string;
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
}

export interface VisibilityConditions {
  operator: 'AND' | 'OR';
  conditions: VisibilityCondition[];
}

export interface FormField {
  id: string;
  task_id: string;
  name: string;
}

export interface UserSubmission {
  task_id: string;
  data: Record<string, any>;
}

export function evaluateVisibility(
  visibilityConditions: VisibilityConditions | null,
  userSubmissions: UserSubmission[],
  formFields: FormField[]
): boolean {
  if (!visibilityConditions || !visibilityConditions.conditions?.length) {
    return true;
  }

  const results = visibilityConditions.conditions.map((cond) => {
    const field = formFields.find((f) => f.id === cond.field_id);
    if (!field) return false;

    const submission = userSubmissions.find((s) => s.task_id === field.task_id);
    if (!submission) return false;

    const value = submission.data?.[field.name];
    if (value === undefined || value === null) return false;

    switch (cond.operator) {
      case 'equals':
        return String(value) === String(cond.value);
      case 'not_equals':
        return String(value) !== String(cond.value);
      case 'contains':
        return String(value).includes(String(cond.value));
      default:
        return false;
    }
  });

  return visibilityConditions.operator === 'AND'
    ? results.every((r) => r)
    : results.some((r) => r);
}
