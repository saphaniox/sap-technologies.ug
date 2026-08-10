/**
 * Icon Selector Component for Award Categories
 * 
 * Professional icon picker with preview for admin panel
 */

import React, { useState } from 'react';
import { Icon } from './IconLibrary';
import '../styles/IconSelector.css';

const AVAILABLE_ICONS = [
  { name: 'trophy', label: 'Trophy', description: 'Excellence & Achievement' },
  { name: 'star', label: 'Star', description: 'Excellence & Recognition' },
  { name: 'medal', label: 'Medal', description: 'Awards & Honor' },
  { name: 'crown', label: 'Crown', description: 'Leadership & Prestige' },
  { name: 'rocket', label: 'Rocket', description: 'Innovation & Growth' },
  { name: 'lightbulb', label: 'Lightbulb', description: 'Innovation & Ideas' },
  { name: 'heart', label: 'Heart', description: 'Community & Social Impact' },
  { name: 'users', label: 'Users', description: 'Community & People' },
  { name: 'globe', label: 'Globe', description: 'Global Impact' },
  { name: 'flag', label: 'Flag', description: 'Regional/National' },
  { name: 'chart', label: 'Chart', description: 'Data & Analytics' },
  { name: 'shield', label: 'Shield', description: 'Security & Trust' },
  { name: 'target', label: 'Target', description: 'Goals & Achievement' },
  { name: 'briefcase', label: 'Briefcase', description: 'Business & Enterprise' },
  { name: 'sparkles', label: 'Sparkles', description: 'Excellence & Quality' },
  { name: 'check', label: 'Checkmark', description: 'Approval & Completion' },
  { name: 'clock', label: 'Clock', description: 'Pending/Time' },
  { name: 'ballot', label: 'Ballot', description: 'Voting' }
];

export const IconSelector = ({ selectedIcon = 'trophy', onSelect, showLabel = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedIconData = AVAILABLE_ICONS.find(icon => icon.name === selectedIcon) || AVAILABLE_ICONS[0];

  const filteredIcons = AVAILABLE_ICONS.filter(icon =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (iconName) => {
    onSelect(iconName);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="icon-selector">
      {showLabel && <label className="icon-selector-label">Category Icon</label>}
      
      <div className="icon-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="selected-icon-preview">
          <Icon name={selectedIcon} size={32} />
          <div className="selected-icon-info">
            <span className="selected-icon-name">{selectedIconData.label}</span>
            <span className="selected-icon-desc">{selectedIconData.description}</span>
          </div>
        </div>
        <span className="icon-selector-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="icon-selector-dropdown">
          <div className="icon-selector-search">
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="icon-selector-grid">
            {filteredIcons.map((icon) => (
              <button
                key={icon.name}
                type="button"
                className={`icon-selector-option ${selectedIcon === icon.name ? 'selected' : ''}`}
                onClick={() => handleSelect(icon.name)}
                title={icon.description}
              >
                <Icon name={icon.name} size={28} />
                <span className="icon-option-label">{icon.label}</span>
              </button>
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="icon-selector-empty">
              <p>No icons found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IconSelector;
