
import { useState } from 'react';

export const useRegenerationState = () => {
  const [regenerating, setRegenerating] = useState(false);
  const [showRegeneratingOverlay, setShowRegeneratingOverlay] = useState(false);

  return {
    regenerating,
    setRegenerating,
    showRegeneratingOverlay,
    setShowRegeneratingOverlay,
  };
};
