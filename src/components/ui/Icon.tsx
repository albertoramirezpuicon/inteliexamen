import { FC } from 'react';
import { IconType } from 'react-icons';

interface IconProps {
  icon: IconType;
  size?: number | string;
  color?: string;
  className?: string;
}

const Icon: FC<IconProps> = ({ icon: IconComponent, size = 24, color = 'currentColor', className = '' }) => (
  <IconComponent size={size} color={color} className={className} />
);

export default Icon; 