import React from 'react';
import { RealStreetMapView } from './RealStreetMapView';

interface VerifiedPlacesViewProps {
  onSwitchToCulturalMode: () => void;
}

export const VerifiedPlacesView: React.FC<VerifiedPlacesViewProps> = ({
  onSwitchToCulturalMode,
}) => {
  return (
    <RealStreetMapView
      onSwitchToCulturalMode={onSwitchToCulturalMode}
    />
  );
};

