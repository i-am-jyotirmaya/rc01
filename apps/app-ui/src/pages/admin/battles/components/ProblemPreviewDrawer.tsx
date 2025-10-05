import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Drawer,
  Empty,
  Input,
  Result,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { TabsProps } from "antd";
import type { FC } from "react";

import type { ProblemMetadata, ProblemRecord } from "@rc01/api-client";
import { validateProblemMarkdown } from "@rc01/problem-template";

import { problemApi } from "../../../../services/api";
import type { ProblemCatalogEntry } from "../types";

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

type ActiveTabKey = "preview" | "edit";

interface ProblemPreviewDrawerProps {
  open: boolean;
  problemSlug: string | null;
  initialMetadata: ProblemCatalogEntry | null;
  onClose: () => void;
  onProblemSaved?: (previousSlug: string, problem: ProblemMetadata) => Promise<void> | void;
}

const renderMetadata = (metadata: ProblemMetadata | ProblemCatalogEntry) => {
  const updatedAt = "updatedAt" in metadata ? metadata.updatedAt : metadata.lastModifiedAt;

  return (
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      <Space wrap size="small">
        {metadata.source ? <Tag color="geekblue">Source: {metadata.source}</Tag> : null}
        {metadata.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
        {metadata.estimatedDurationMinutes ? (
          <Text type="secondary">~{metadata.estimatedDurationMinutes} min</Text>
        ) : null}
      </Space>
      {metadata.author ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Author: {metadata.author}
        </Text>
      ) : null}
      {updatedAt ? <Text type="secondary">Updated {new Date(updatedAt).toLocaleString()}</Text> : null}
    </Space>
  );
};

export const ProblemPreviewDrawer: FC<ProblemPreviewDrawerProps> = ({
  open,
  problemSlug,
  initialMetadata,
  onClose,
  onProblemSaved,
}) => {
  const [problem, setProblem] = useState<ProblemRecord | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [draftContent, setDraftContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTabKey>("preview");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    if (!open) {
      setProblem(null);
      setOriginalContent("");
      setDraftContent("");
      setLoadError(null);
      setIsLoading(false);
      setActiveTab("preview");
      return;
    }

    if (!problemSlug) {
      setProblem(null);
      setOriginalContent("");
      setDraftContent("");
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setLoadError(null);

    const fetchProblem = async () => {
      try {
        const response = await problemApi.getProblem(problemSlug);
        if (!isCurrent) {
          return;
        }

        setProblem(response.problem);
        setOriginalContent(response.problem.content);
        setDraftContent(response.problem.content);
      } catch (error) {
        if (isCurrent) {
          setLoadError(error as Error);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void fetchProblem();

    return () => {
      isCurrent = false;
    };
  }, [open, problemSlug, reloadKey]);

  const resolvedMetadata = useMemo<ProblemMetadata | ProblemCatalogEntry | null>(() => {
    if (problem) {
      return problem;
    }

    return initialMetadata;
  }, [problem, initialMetadata]);

  const hasChanges = draftContent !== originalContent;

  const handleRetry = () => {
    setReloadKey((previous) => previous + 1);
  };

  const handleSave = async () => {
    if (!problemSlug) {
      return;
    }

    const trimmed = draftContent.trim();
    if (!trimmed) {
      message.error("Problem content cannot be empty.");
      return;
    }

    const validation = validateProblemMarkdown(trimmed);
    if (!validation.isValid) {
      message.error(
        validation.issues.map((issue) => issue.message).join("\n") || "Problem content does not match the template.",
      );
      return;
    }

    try {
      setIsSaving(true);
      const previousSlug = problem?.slug ?? problemSlug;
      const response = await problemApi.updateProblem(previousSlug, trimmed);
      setProblem(response.problem);
      setOriginalContent(response.problem.content);
      setDraftContent(response.problem.content);
      setActiveTab("preview");
      message.success("Problem saved successfully.");
      if (onProblemSaved) {
        await onProblemSaved(previousSlug, response.problem);
      }
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraftContent(originalContent);
    setActiveTab("preview");
  };

  const tabItems: TabsProps["items"] = [
    {
      key: "preview",
      label: "Preview",
      children: problem ? (
        <Paragraph style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", backgroundColor: "#fafafa", padding: 12 }}>
          {problem.content}
        </Paragraph>
      ) : isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <Empty description="Problem content unavailable" />
      ),
    },
    {
      key: "edit",
      label: "Edit",
      children: (
        <TextArea
          value={draftContent}
          onChange={(event) => setDraftContent(event.target.value)}
          style={{ minHeight: 360, fontFamily: "monospace" }}
          disabled={isSaving || isLoading}
        />
      ),
    },
  ];

  const renderBody = () => {
    if (loadError) {
      return (
        <Result
          status="error"
          title="Unable to load problem"
          subTitle={loadError.message}
          extra={
            <Button type="primary" onClick={handleRetry}>
              Retry
            </Button>
          }
        />
      );
    }

    if (!resolvedMetadata) {
      return <Empty description="Select a problem to preview" />;
    }

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            {resolvedMetadata.title}
          </Title>
          {renderMetadata(resolvedMetadata)}
        </div>
        {problem && !hasChanges && activeTab === "edit" ? (
          <Alert type="info" message="No changes to save." showIcon />
        ) : null}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as ActiveTabKey)}
          items={tabItems}
        />
        <Space>
          <Button type="primary" onClick={handleSave} disabled={!hasChanges} loading={isSaving}>
            Save changes
          </Button>
          <Button onClick={handleReset} disabled={!hasChanges || isSaving}>
            Reset
          </Button>
          <Button onClick={onClose} disabled={isSaving}>
            Close
          </Button>
        </Space>
      </Space>
    );
  };

  return (
    <Drawer
      title="Problem preview"
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      {renderBody()}
    </Drawer>
  );
};
