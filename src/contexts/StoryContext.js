import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../sanity';
import StoryModal from '../components/StoryModal';

const StoryContext = createContext();

export const useStory = () => useContext(StoryContext);

export const StoryProvider = ({ children }) => {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);

  useEffect(() => {
    // Fetch all section stories
    client.fetch(`*[_type == "sectionStory"] {
      sectionId,
      title,
      story
    }`).then(data => {
      setStories(data);
    }).catch(err => {
      console.error("Failed to fetch section stories:", err);
    });
  }, []);

  const getStoryForSection = (sectionId) => {
    return stories.find(s => s.sectionId === sectionId);
  };

  const openStory = (sectionId) => {
    const story = getStoryForSection(sectionId);
    if (story) {
      setActiveStory(story);
    }
  };

  const closeStory = () => {
    setActiveStory(null);
  };

  return (
    <StoryContext.Provider value={{ getStoryForSection, openStory }}>
      {children}
      {activeStory && (
        <StoryModal story={activeStory} onClose={closeStory} />
      )}
    </StoryContext.Provider>
  );
};
