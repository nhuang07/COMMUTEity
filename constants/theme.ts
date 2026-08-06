export const theme = {
  colors: {
    primary: '#2563EB',         // blue-600 — CTA buttons
    primaryActive: '#DC2626',   // red-600 — active commute state
    success: '#16A34A',         // green-600 — mutual match
    background: '#F8FAFC',      // slate-50 — screen backgrounds
    surface: '#FFFFFF',         // white — card backgrounds
    textPrimary: '#0F172A',     // slate-900 — headings, body
    textSecondary: '#64748B',   // slate-500 — labels, timestamps
    border: '#E2E8F0',         // slate-200 — subtle borders
    disabled: '#CBD5E1',       // slate-300 — disabled elements
    destructive: '#DC2626',    // red-600 — delete actions
    warning: '#D97706',        // amber-600 — warning badges
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
} as const;
