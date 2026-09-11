/**
 * Helper to resolve valid Ionicons icon names for service titles/icons,
 * preventing '?' fallback icons in Expo vector icons.
 */
export const getServiceIconName = (itemOrTitle, rawIconName) => {
  let title = '';
  let icon = '';

  if (typeof itemOrTitle === 'string') {
    title = itemOrTitle.toLowerCase();
    icon = (rawIconName || '').toLowerCase();
  } else if (itemOrTitle && typeof itemOrTitle === 'object') {
    title = (itemOrTitle.title || '').toLowerCase();
    icon = (itemOrTitle.icon || '').toLowerCase();
  }

  // List of known valid Ionicons icon names v5
  const validIonicons = [
    'construct-outline',
    'flash-outline',
    'sync-outline',
    'toggle-outline',
    'build-outline',
    'power-outline',
    'water-outline',
    'hammer-outline',
    'cog-outline',
    'options-outline',
    'settings-outline',
    'hardware-chip-outline',
    'shield-checkmark-outline',
    'construct',
    'flash',
    'sync',
    'toggle',
    'build',
    'power',
    'water'
  ];

  if (icon && validIonicons.includes(icon)) {
    return icon;
  }

  // Infer best icon based on service title or raw icon keywords
  const combined = `${title} ${icon}`;

  if (combined.includes('mixi') || combined.includes('grinder') || combined.includes('mixer') || combined.includes('blade') || combined.includes('repair')) {
    return 'build-outline';
  }
  if (combined.includes('fan') || combined.includes('cooler') || combined.includes('exhaust') || combined.includes('motor')) {
    return 'sync-outline';
  }
  if (combined.includes('wiring') || combined.includes('wire') || combined.includes('short') || combined.includes('circuit') || combined.includes('electric') || combined.includes('power')) {
    return 'flash-outline';
  }
  if (combined.includes('switch') || combined.includes('board') || combined.includes('socket') || combined.includes('mcb') || combined.includes('plug')) {
    return 'toggle-outline';
  }
  if (combined.includes('wash') || combined.includes('machine') || combined.includes('water') || combined.includes('geyser') || combined.includes('pump')) {
    return 'water-outline';
  }
  if (combined.includes('tv') || combined.includes('screen') || combined.includes('fridge') || combined.includes('ac') || combined.includes('air')) {
    return 'hardware-chip-outline';
  }

  return 'construct-outline';
};
