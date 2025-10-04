import { Alert, Col, Layout, Result, Row, Skeleton, Space, Tabs, Typography } from "antd";
import type { TabsProps } from "antd";
import type { FC } from "react";
import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { BattleConfigDetailsCard } from "./components/BattleConfigDetailsCard";
import { BattleConfigAdvancedCard } from "./components/BattleConfigAdvancedCard";
import { BattleConfigSummaryCard } from "./components/BattleConfigSummaryCard";
import { BattleProblemSelectionCard } from "./components/BattleProblemSelectionCard";
import { useAvailableProblemsCatalog } from "./hooks/useAvailableProblemsCatalog";
import { useBattleConfigDraft } from "./hooks/useBattleConfigDraft";
import type { BattleProblemSummary } from "./types";

const { Content } = Layout;

export const AdminBattleConfigPage: FC = () => {
  const params = useParams<{ battleId: string }>();
  const battleId = params.battleId ?? "preview-battle";

  const {
    draft,
    isLoading,
    loadError,
    updateDraft,
    updateProblems,
    persistDraft,
    publishDraft,
    resetLocalChanges,
    hasLocalChanges,
  } = useBattleConfigDraft({ battleId });

  const {
    problems: catalog,
    isLoading: isCatalogLoading,
    error: catalogError,
    refresh,
  } = useAvailableProblemsCatalog();

  const handleToggleProblem = useCallback(
    (problem: BattleProblemSummary) => {
      if (!draft) {
        return;
      }

      const isSelected = draft.problems.some((entry) => entry.id === problem.id);
      const nextProblems = isSelected
        ? draft.problems.filter((entry) => entry.id !== problem.id)
        : [...draft.problems, problem];

      updateProblems(nextProblems);
    },
    [draft, updateProblems],
  );

  const renderContent = () => {
    if (loadError) {
      return (
        <Result
          status="error"
          title="Unable to load battle configuration"
          subTitle="TODO: handle retry/backoff states when API is available."
        />
      );
    }

    if (!draft || isLoading) {
      return <Skeleton active avatar paragraph={{ rows: 12 }} />;
    }

    const tabItems: TabsProps["items"] = [
      {
        key: "basics",
        label: "Battle basics",
        children: <BattleConfigDetailsCard draft={draft} onChange={updateDraft} />,
      },
      {
        key: "advanced",
        label: "Advanced settings",
        children: <BattleConfigAdvancedCard draft={draft} onChange={updateDraft} />,
      },
      {
        key: "problems",
        label: "Problem catalog",
        children: (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <BattleProblemSelectionCard
              draft={draft}
              availableProblems={catalog}
              isLoading={isCatalogLoading}
              onToggleProblem={handleToggleProblem}
              onRefresh={refresh}
            />
            {catalogError ? (
              <Alert
                type="warning"
                message="Problem catalog unavailable"
                description={catalogError.message}
                showIcon
              />
            ) : null}
          </Space>
        ),
      },
    ];

    return (
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14} xl={16}>
          <Tabs defaultActiveKey="basics" items={tabItems} />
        </Col>
        <Col xs={24} lg={10} xl={8}>
          <BattleConfigSummaryCard
            draft={draft}
            hasLocalChanges={hasLocalChanges}
            onPersist={persistDraft}
            onPublish={publishDraft}
            onReset={resetLocalChanges}
          />
        </Col>
      </Row>
    );
  };

  return (
    <Content style={{ padding: "32px 24px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            Battle configuration
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Drafting battle outcomes for <Typography.Text code>{battleId}</Typography.Text>. TODO: replace stub data once
            battle service endpoints are stable.
          </Typography.Paragraph>
        </div>
        {renderContent()}
      </Space>
    </Content>
  );
};
