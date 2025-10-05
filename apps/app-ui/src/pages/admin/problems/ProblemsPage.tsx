import { Alert, Button, Card, Empty, Layout, List, Skeleton, Space, Tag, Typography } from "antd";
import type { FC } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { ProblemMetadata } from "@rc01/api-client";

import { fetchProblems } from "../../../features/problems/problemsSlice";
import {
  selectProblems,
  selectProblemsError,
  selectProblemsStatus,
} from "../../../features/problems/selectors";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";

const { Content } = Layout;

const renderProblem = (problem: ProblemMetadata, onOpen: () => void) => {
  const hasMetadata = Boolean(problem.author || problem.source || problem.estimatedDurationMinutes);

  return (
    <List.Item
      actions={[
        <Button key="open" type="link" onClick={onOpen}>
          Open
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <Space size="small">
            <Typography.Text strong>{problem.title}</Typography.Text>
            <Tag color="gold">{problem.difficulty}</Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Space wrap size={4}>
              {problem.tags.map((tag: string) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {problem.estimatedDurationMinutes ? (
                <Typography.Text type="secondary">
                  ~{problem.estimatedDurationMinutes} min
                </Typography.Text>
              ) : null}
            </Space>
            {hasMetadata ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {problem.author ? `Author: ${problem.author}` : null}
                {problem.author && problem.source ? " · " : null}
                {problem.source ? `Source: ${problem.source}` : null}
              </Typography.Text>
            ) : null}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Updated {new Date(problem.updatedAt).toLocaleString()}
            </Typography.Text>
          </Space>
        }
      />
    </List.Item>
  );
};

export const ProblemsPage: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const problems = useAppSelector(selectProblems);
  const status = useAppSelector(selectProblemsStatus);
  const error = useAppSelector(selectProblemsError);

  const isLoading = status === "loading";

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchProblems());
    }
  }, [status, dispatch]);

  const handleRefresh = () => {
    void dispatch(fetchProblems());
  };

  const renderContent = () => {
    if (isLoading && !problems.length) {
      return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    if (!problems.length) {
      return <Empty description="No problems found yet." />;
    }

    return (
      <List
        dataSource={problems}
        renderItem={(problem) => renderProblem(problem, () => navigate(`/admin/problems/${problem.slug}`))}
      />
    );
  };

  return (
    <Content style={{ padding: "32px 24px", width: "100%", maxWidth: 1280, margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            Problem library
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Create and curate coding problems that can be reused across battles.
          </Typography.Paragraph>
        </div>
        <Card
          title="Available problems"
          extra={
            <Space>
              <Button type="primary" onClick={() => navigate("/admin/problems/new")}>Create problem</Button>
              <Button onClick={handleRefresh} loading={isLoading} disabled={isLoading && !problems.length}>
                Refresh
              </Button>
            </Space>
          }
        >
          {error ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Problem catalog unavailable"
              description={error}
            />
          ) : null}
          {renderContent()}
        </Card>
      </Space>
    </Content>
  );
};
