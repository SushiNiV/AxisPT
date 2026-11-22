/**
 * Decides where a notification redirects, from its type, the viewer's role and
 * its data. Routes match App.js. Keep in sync with the backend types.
 */

export const getRole = () =>
  (sessionStorage.getItem('role') || localStorage.getItem('role') || '').toLowerCase();

const dashboardFor = (role) => (role === 'student' ? '/student/dashboard' : '/admin/dashboard');
const isStudent = (role) => role === 'student';

const MASTERLIST = '/admin/student-management/masterlist';

// Masterlist.js reads ?students=<ids>: it shows and selects exactly those students.
// Older notifications have no ids, so they open the plain masterlist.
const atRiskList = (data) =>
  Array.isArray(data.studentIds) && data.studentIds.length
    ? `${MASTERLIST}?students=${data.studentIds.join(',')}`
    : MASTERLIST;

const RESOLVERS = {
  announcement: (data, role) => dashboardFor(role),
  grade_posted: (data, role) => (isStudent(role) ? '/student/academics' : null),
  incomplete_grade: (data, role) => (isStudent(role) ? '/student/academics' : null),
  standing_changed: (data, role) => (isStudent(role) ? '/student/academics' : MASTERLIST),
  students_at_risk: (data, role) => (isStudent(role) ? null : atRiskList(data)),
  account: (data, role) => (isStudent(role) ? '/student/profile' : '/change-password'),
  enrollment: (data, role) => (role === 'admin' ? '/admin/access-control/manage-people' : role === 'faculty' ? MASTERLIST : null),
  system: (data, role) => (role === 'admin' ? '/admin/history' : null),
};

// Only same-site paths, never "//host" or full URLs.
const safeInternal = (link) =>
  typeof link === 'string' && link.startsWith('/') && !link.startsWith('//') ? link : null;

/**
 * @returns {string} an existing route; falls back to the viewer's dashboard so a
 * click never lands on a blank page.
 */
export function resolveNotificationLink(item, role = getRole()) {
  const resolver = RESOLVERS[item?.type];
  const target = resolver ? resolver(item.data || {}, role) : null;
  if (target) return target;

  const legacy = safeInternal(item?.link);
  if (legacy && legacy !== '/dashboard') return legacy; // '/dashboard' never existed as a route
  return dashboardFor(role);
}