import React from 'react';
import { Caption1Strong } from '@fluentui/react-components';
import { SimaPisysLogo } from '../icons/AIFoundryLogo';
import styles from './BuiltWithBadge.module.css';

interface BuiltWithBadgeProps {
  className?: string;
}

export const BuiltWithBadge: React.FC<BuiltWithBadgeProps> = ({ className }) => {
  const handleClick = () => {
    // Link to Microsoft Foundry marketing page
    // In production, this could fetch user's Azure config and link to their specific project
    window.open('https://azure.microsoft.com/en-us/products/ai-foundry', '_blank');
  };

  return (
    <button
      className={`${styles.badge} ${className || ''}`}
      onClick={handleClick}
      type="button"
      aria-label="Built with Microsoft Foundry"
    >
      <span className={styles.logo}>
        <SimaPisysLogo />
      </span>
      <Caption1Strong className={styles.brand}>
        SIMA AI
      </Caption1Strong>
    </button>
  );
};
