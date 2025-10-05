import { UploadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Layout,
  Result,
  Skeleton,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadProps } from "antd/es/upload";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { ProblemRecord } from "@rc01/api-client";
import { MarkdownEditor } from "@rc01/markdown-tools";
import { buildProblemTemplate, validateProblemMarkdown } from "@rc01/problem-template";

import { upsertProblem, fetchProblems } from "../../../features/problems/problemsSlice";
import { useAppDispatch } from "../../../store/hooks";
import { problemApi } from "../../../services/api";

const { Content } = Layout;

interface ProblemComposerPageProps {
  mode: "create" | "edit";
}

const templateContent = () => buildProblemTemplate();

const validationIssuesToList = (issues: string[]) => (
  <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
    {issues.map((issue) => (
      <li key={issue}>{issue}</li>
    ))}
  </ul>
);

export const ProblemComposerPage: FC<ProblemComposerPageProps> = ({ mode }) => {
  const isEditMode = mode === "edit";
  const params = useParams<{ problemSlug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [problem, setProblem] = useState<ProblemRecord | null>(null);
  const [content, setContent] = useState<string>(isEditMode ? "" : templateContent());
  const [originalContent, setOriginalContent] = useState<string>(isEditMode ? "" : templateContent());
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const validation = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) {
      return { isValid: false, issues: ["Problem content cannot be empty."] };
    }

    return validateProblemMarkdown(trimmed);
  }, [content]);

  const validationIssues = useMemo(() => {
    if (validation.isValid) {
      return [] as string[];
    }

    return validation.issues.map((issue: string | { message: string }) =>
      typeof issue === "string" ? issue : issue.message,
    );
  }, [validation]);

  const hasChanges = isEditMode ? content !== originalContent : Boolean(content.trim());

  const handleBackToList = () => {
    navigate("/admin/problems");
  };

  const bootstrap = useCallback(async () => {
    if (!isEditMode) {
      return;
    }

    const slug = params.problemSlug;
    if (!slug) {
      setLoadError("Problem not found.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await problemApi.getProblem(slug);
      setProblem(response.problem);
      setContent(response.problem.content);
      setOriginalContent(response.problem.content);
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isEditMode, params.problemSlug]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const handleReset = () => {
    if (isEditMode) {
      setContent(originalContent);
      return;
    }

    const template = templateContent();
    setContent(template);
    setOriginalContent(template);
  };

  const persistProblem = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      message.error("Problem content cannot be empty.");
      return;
    }

    if (validationIssues.length) {
      message.error("Fix template issues before saving.");
      return;
    }

    try {
      setIsSaving(true);
      if (isEditMode && params.problemSlug) {
        const previousSlug = params.problemSlug;
        const response = await problemApi.updateProblem(previousSlug, trimmed);
        setProblem(response.problem);
        setContent(response.problem.content);
        setOriginalContent(response.problem.content);
        dispatch(upsertProblem(response.problem));
        message.success("Problem updated successfully.");
        if (previousSlug !== response.problem.slug) {
          navigate(`/admin/problems/${response.problem.slug}`, { replace: true });
        }
      } else {
        const response = await problemApi.createProblemFromContent(trimmed);
        setProblem(response.problem);
        setContent(response.problem.content);
        setOriginalContent(response.problem.content);
        dispatch(upsertProblem(response.problem));
        message.success("Problem created successfully.");
        navigate(`/admin/problems/${response.problem.slug}`, { replace: true });
      }

      void dispatch(fetchProblems());
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".md,.markdown,.txt",
    beforeUpload: async (file) => {
      try {
        const text = await file.text();
        setContent(text);
        message.success("Markdown imported.");
      } catch (error) {
        message.error((error as Error).message);
      }

      return Upload.LIST_IGNORE;
    },
    showUploadList: false,
    disabled: isSaving || isLoading,
  };

  const renderValidationBanner = () => {
    if (!content.trim()) {
      return null;
    }

    if (validationIssues.length) {
      return (
        <Alert
          type="error"
          showIcon
          message="Template validation failed"
          description={validationIssuesToList(validationIssues)}
        />
      );
    }

    return <Alert type="success" showIcon message="Template passes validation" />;
  };

  const renderMetadata = () => {
    if (!problem) {
      return null;
    }

    return (
      <Space direction="vertical" size={4}>
        <Typography.Text type="secondary">Slug: {problem.slug}</Typography.Text>
        <Typography.Text type="secondary">Filename: {problem.filename}</Typography.Text>
        <Typography.Text type="secondary">Updated {new Date(problem.updatedAt).toLocaleString()}</Typography.Text>
      </Space>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 12 }} />;
    }

    if (loadError) {
      return (
        <Result
          status="error"
          title="Unable to load problem"
          subTitle={loadError}
          extra={
            <Space>
              <Button type="primary" onClick={bootstrap}>
                Retry
              </Button>
              <Button onClick={handleBackToList}>Back to library</Button>
            </Space>
          }
        />
      );
    }

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {renderMetadata()}
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 32 }} />
          </p>
          <p className="ant-upload-text">Click or drag markdown file to import</p>
          <p className="ant-upload-hint">Existing content will be replaced with the imported file.</p>
        </Upload.Dragger>
        <MarkdownEditor value={content} onChange={setContent} minHeight={360} />
        {renderValidationBanner()}
        <Space>
          <Button
            type="primary"
            onClick={persistProblem}
            loading={isSaving}
            disabled={!hasChanges || isSaving || validationIssues.length > 0}
          >
            {isEditMode ? "Save changes" : "Create problem"}
          </Button>
          <Button onClick={handleReset} disabled={!hasChanges || isSaving}>
            Reset
          </Button>
          <Button onClick={handleBackToList} disabled={isSaving}>
            Back to library
          </Button>
        </Space>
      </Space>
    );
  };

  const title = isEditMode
    ? problem?.title ?? params.problemSlug ?? "Edit problem"
    : "Create problem";

  const description = isEditMode
    ? "Update markdown content and metadata for this problem."
    : "Start from the template or import existing markdown to add a new problem.";

  return (
    <Content style={{ padding: "32px 24px", width: "100%", maxWidth: 1280, margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {description}
          </Typography.Paragraph>
        </div>
        <Card>{renderBody()}</Card>
      </Space>
    </Content>
  );
};
