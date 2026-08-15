import type { ReactNode } from "react";
import { Avatar } from '@fluentui/react-components';
import { Bot24Regular } from '@fluentui/react-icons';


import logoSrc from "../icons/logo-rounded.png";

interface SimaPisysLogoProps {
  size?: number | string;
}

function SimaPisysLogo({ size = 40 }: SimaPisysLogoProps): ReactNode {
  return (
    <img
      src={logoSrc}
      alt="Logo de SIMA PISYS"
      width={size}
      height={size}
      style={{ 
        objectFit: 'cover'
      }}
    />
  );
}


interface AgentIconProps {
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  logoUrl?: string;
  useSimaLogo?: boolean; 
}

export function AgentIcon({ 
  alt = "AI Assistant", 
  size = 'large',
  logoUrl,
  useSimaLogo = true 
}: AgentIconProps) {
  const sizeMap: Record<string, number> = {
    small: 32,
    medium: 50,
    large: 60,
  };

  const avatarSize = sizeMap[size];

  
  const getIcon = () => {
    if (useSimaLogo) {
      
      return <SimaPisysLogo size={avatarSize} />;
    }
    if (logoUrl) {
      
      return null;
    }
    
    return <Bot24Regular />;
  };

  const iconElement = getIcon();

  return (
    <Avatar
      aria-label={alt}
      image={!useSimaLogo && logoUrl ? { src: logoUrl } : undefined}
      icon={iconElement ? iconElement : undefined}
      size={avatarSize as 16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 96 | 120 | 128}
      color="brand"
    />
  );
}

