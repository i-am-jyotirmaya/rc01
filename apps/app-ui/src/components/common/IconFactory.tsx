import type { CSSProperties, FC } from "react";
import {
  CodeOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { HeroIconKey } from "../../features/arena/arenaSlice";

const iconMap: Record<HeroIconKey, typeof CodeOutlined> = {
  code: CodeOutlined,
  team: TeamOutlined,
  thunderbolt: ThunderboltOutlined,
  trophy: TrophyOutlined,
};

interface IconFactoryProps {
  icon: HeroIconKey;
  style?: CSSProperties;
}

export const IconFactory: FC<IconFactoryProps> = ({ icon, style }) => {
  const IconComponent = iconMap[icon];
  return <IconComponent style={style} />;
};
