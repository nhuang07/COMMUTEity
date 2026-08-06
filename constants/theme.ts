export const theme = {
  colors: {
    // Forest-green accent system (dark-first) — replaces the prior generic blue.
    primary: '#3F7449',         // forest green — CTAs, links, active states
    primaryPressed: '#356239',  // pressed/hover state for primary
    primaryForeground: '#F3FAF4',
    accentMuted: '#A1C8A8',     // pale sage — soft badges, subtle highlights
    accentMutedForeground: '#1B3320',

    recording: '#E5484D',       // active/live commute indicator (not destructive)
    success: '#3F7449',         // mutual match confirmed — same family as primary
    warning: '#D9A441',
    destructive: '#E5484D',

    background: '#0A0D0B',      // near-black, green-tinted — screen backgrounds
    surface: '#141917',         // card / input backgrounds
    surfaceRaised: '#1B211E',   // popovers, active/elevated surfaces
    border: '#242B26',          // hairline borders
    borderStrong: '#333C36',    // emphasized borders (focus, dividers)

    textPrimary: '#F2F5F3',
    textSecondary: '#9BA79E',
    textMuted: '#6B766F',
    disabled: '#3A423D',
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
    sm: 6,
    md: 8,
    lg: 10,
    xl: 14,
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
  // UI/body copy — Plus Jakarta Sans. Each RN "weight" is a distinct font file,
  // so fontFamily (not fontWeight) is what actually changes weight on-screen.
  fontFamily: {
    normal: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  // Display/headings — Space Grotesk.
  fontFamilyDisplay: {
    medium: 'SpaceGrotesk_500Medium',
    semibold: 'SpaceGrotesk_600SemiBold',
    bold: 'SpaceGrotesk_700Bold',
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.24,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.32,
      shadowRadius: 10,
      elevation: 6,
    },
  },
} as const;
