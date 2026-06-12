const statsBento = {
  name: 'statsBento',
  title: 'Stats Bento Configuration',
  type: 'document',
  fields: [
    { 
      name: 'githubUsername', 
      title: 'GitHub Username', 
      type: 'string',
      description: 'Used for fetching commit data or generating heatmaps.' 
    },
    { name: 'photosCount', title: 'Photos Captured', type: 'string' },
    { name: 'photoStyles', title: 'Photography Styles', type: 'string' },
    { name: 'photoAwards', title: 'Photography Awards', type: 'string' },
    { name: 'wpmSpeed', title: 'Typing Speed (WPM)', type: 'number' },
    { name: 'uiDesigns', title: 'UI Designs Built', type: 'string' },
    { name: 'travelKm', title: 'Kilometers Explored', type: 'string' },
    { name: 'coursesCompleted', title: 'Courses Completed', type: 'string' },
    { name: 'stacksLearned', title: 'Tech Stacks Learned', type: 'string' },
    { name: 'primaryAchievement', title: 'Primary Highlighted Achievement', type: 'string' }
  ]
};

export default statsBento;
