export const getServiceIllustration = (title, icon) => {
  // If icon is a URL or Base64 string, use it directly!
  if (icon && (icon.startsWith('data:') || icon.startsWith('http'))) {
    return icon;
  }

  if (!title) return 'https://image.pollinations.ai/prompt/A+premium+3D+clay-rendered+illustration+of+a+crossed+wrench+and+screwdriver+tool+set+with+clean+glossy+finish,+isolated+on+a+solid+dark+purple+background+%23312c51?width=256&height=256&model=flux&nologo=true&seed=999';
  const t = title.toLowerCase();

  // Clean prompt helper with background blending
  const getPrompt = (subject, seed) => {
    const encodedSubject = encodeURIComponent(subject);
    return `https://image.pollinations.ai/prompt/A+premium+3D+clay-rendered+illustration+of+${encodedSubject}+with+clean+glossy+finish,+isolated+on+a+solid+dark+purple+background+%23312c51?width=256&height=256&model=flux&nologo=true&seed=${seed}`;
  };

  // Mixi repair / Grinder repair
  if (t.includes('mixi') || t.includes('mixer') || t.includes('grinder')) {
    return getPrompt('a modern kitchen mixer grinder blender machine', 42);
  }
  // Salon (Women)
  if (t.includes('women') && t.includes('salon')) {
    return getPrompt('a beauty cosmetic spa woman head wearing a headband and a green clay facial mask', 11);
  }
  // Salon (Men)
  if (t.includes('men') && t.includes('salon')) {
    return getPrompt('a handsome man head with green cucumber eye patches and shaving cream on his cheeks', 22);
  }
  // Cleaning
  if (t.includes('clean') || t.includes('vacuum') || t.includes('wash') || t.includes('maid')) {
    return getPrompt('a red premium vacuum cleaner appliance', 33);
  }
  // Painting
  if (t.includes('paint') || t.includes('wall') || t.includes('proof')) {
    return getPrompt('a yellow paint roller with a wooden handle', 55);
  }
  // AC / Cooling
  if (t.includes('ac') || t.includes('conditioner') || t.includes('cooling')) {
    return getPrompt('a white indoor wall air conditioner unit blowing gentle cool air', 77);
  }
  // Fan
  if (t.includes('fan')) {
    return getPrompt('a modern white three blade ceiling fan appliance', 88);
  }

  // Fallback / Dynamic generation for admin services
  // Calculate a consistent seed based on the service name to ensure the generated image remains stable
  let seedVal = 0;
  for (let i = 0; i < title.length; i++) {
    seedVal = (seedVal + title.charCodeAt(i) * (i + 1)) % 10000;
  }
  
  // Format the title nicely for the prompt description
  const cleanSubject = `a specialized ${t} tool or object representing the service`;
  return getPrompt(cleanSubject, seedVal);
};
