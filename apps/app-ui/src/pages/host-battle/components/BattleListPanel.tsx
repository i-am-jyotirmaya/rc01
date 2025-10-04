import { Button, ConfigProvider, Empty, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { FC } from "react";
import { useMemo } from "react";
import type { BattleRecord } from "@rc/api-client";
import type { HostBattleVisualConfig } from "../hooks/useHostBattleVisualConfig";
import { formatDateTime, isConfigurableStatus, statusMeta } from "../../../features/hostBattle/utils";

const { Title, Paragraph, Text } = Typography;

interface BattleListPanelProps {
  visual: HostBattleVisualConfig;
  battles: BattleRecord[];
  loading: boolean;
  startingBattleId: string | null;
  onConfigure: (battle: BattleRecord) => void;
  onStartBattle: (battle: BattleRecord) => void;
}

export const BattleListPanel: FC<BattleListPanelProps> = ({
  visual,
  battles,
  loading,
  startingBattleId,
  onConfigure,
  onStartBattle,
}) => {
  const columns = useMemo<ColumnsType<BattleRecord>>(
    () => [
      {
        title: "Battle",
        dataIndex: "name",
        key: "name",
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: visual.palette.headingColor }}>
              {record.name}
            </Text>
            {record.shortDescription ? (
              <Text type="secondary" style={{ color: visual.palette.paragraphMutedColor }}>
                {record.shortDescription}
              </Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: "Mode",
        dataIndex: ["configuration", "gameMode"],
        key: "mode",
        render: (_, record) => {
          const config = (record.configuration ?? {}) as { gameMode?: string; difficulty?: string };
          const parts = [config.gameMode, config.difficulty].filter(Boolean);
          return parts.length ? parts.join(" · ") : "—";
        },
      },
      {
        title: "Players",
        dataIndex: ["configuration", "maxPlayers"],
        key: "players",
        render: (_, record) => {
          const config = (record.configuration ?? {}) as { maxPlayers?: number };
          return config.maxPlayers ?? "—";
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value: BattleRecord["status"]) => {
          const meta = statusMeta[value];
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Scheduled",
        dataIndex: "scheduledStartAt",
        key: "scheduledStartAt",
        render: (value: string | null | undefined, record) => {
          const config = (record.configuration ?? {}) as { scheduledStartAt?: string | null };
          return formatDateTime(value ?? config.scheduledStartAt);
        },
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => {
          const canStart = isConfigurableStatus(record.status) && !record.autoStart;
          return (
            <Space size="small">
              <Button type="link" onClick={() => onConfigure(record)} disabled={!isConfigurableStatus(record.status)}>
                Configure
              </Button>
              <Button
                type="link"
                onClick={() => onStartBattle(record)}
                disabled={!canStart}
                loading={startingBattleId === record.id}
              >
                Start now
              </Button>
            </Space>
          );
        },
      },
    ],
    [onConfigure, onStartBattle, startingBattleId, visual.palette.headingColor, visual.palette.paragraphMutedColor],
  );

  return (
    <ConfigProvider theme={visual.styles.formTheme}>
      <div style={visual.styles.tablePanelStyle}>
        <Title level={4} style={{ margin: 0, color: visual.palette.headingColor }}>
          Battle control center
        </Title>
        <Paragraph style={{ margin: 0, color: visual.palette.bodyTextColor }}>
          Monitor upcoming battles, tweak configurations, and launch when the timing is right. Scheduled battles will
          auto-launch, while manual battles stay parked here until you start them.
        </Paragraph>
        <Table
          columns={columns}
          dataSource={battles}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{ emptyText: <Empty description="No battles configured yet" /> }}
          style={{ background: "transparent" }}
        />
      </div>
    </ConfigProvider>
  );
};
