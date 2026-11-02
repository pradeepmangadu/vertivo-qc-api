export const INSPECTION_STATUSES = ['Accepted', 'Issue found', 'Missing', 'Damaged', 'Not applicable'] as const;
export const OVERALL_STATUSES = ['Pending inspection', 'Accepted', 'Accepted with issues', 'Rejected / hold'] as const;
export const ISSUE_STATUSES: readonly string[] = ['Issue found', 'Missing', 'Damaged'];
export const COOKIES = { access: 'qc_at', refresh: 'qc_rt', csrf: 'qc_csrf' } as const;
