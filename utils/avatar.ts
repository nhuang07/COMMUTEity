export function getAvatarInitial(name: string): string {
  return (name.charAt(0) || '?').toUpperCase();
}
