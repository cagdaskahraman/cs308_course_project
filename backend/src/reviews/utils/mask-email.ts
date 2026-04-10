/** Masks an email for public display (e.g. j***@e***.com). */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) {
    return '***';
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.indexOf('.');
  const domainHead = dot === -1 ? domain : domain.slice(0, dot);
  const rest = dot === -1 ? '' : domain.slice(dot);
  const maskedLocal = local.length <= 1 ? '*' : `${local[0]}***`;
  const maskedDomain =
    domainHead.length <= 1 ? '*' : `${domainHead[0]}***`;
  return `${maskedLocal}@${maskedDomain}${rest}`;
}
