import { useMemo, useState } from "react";

import {
  Alert,
  Button,
  Modal,
  Space,
  Tabs,
  Typography,
  Upload,
  message,
  Input,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { TabsProps } from "antd";
import type { UploadProps } from "antd/es/upload";

import {
  buildProblemTemplate,
  validateProblemMarkdown,
} from "@rc01/problem-template";

import type { ProblemRecord } from "@rc01/api-client";

import { problemApi } from "../../../../services/api";

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

type AddProblemModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (problem: ProblemRecord) => Promise<void> | void;
};

const defaultTemplate = (): string => buildProblemTemplate();

const renderValidationIssues = (issues: string[]) => (
  <Alert
    type="error"
    showIcon
    message="Template validation failed"
    description={
      <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    }
  />
);

export const AddProblemModal = ({
  open,
  onClose,
  onCreated,
}: AddProblemModalProps) => {
  const [activeTab, setActiveTab] = useState<"upload" | "compose">("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorContent, setEditorContent] = useState<string>(defaultTemplate);

  const validationResult = useMemo(() => {
    const trimmed = editorContent.trim();
    if (!trimmed) {
      return { isValid: false, issues: ["Problem content cannot be empty."] };
    }

    return validateProblemMarkdown(trimmed);
  }, [editorContent]);

  const validationIssues = useMemo(() => {
    if (validationResult.isValid) {
      return [];
    }

    return validationResult.issues.map((issue) =>
      typeof issue === "string" ? issue : issue.message,
    );
  }, [validationResult]);

  const handleSuccess = async (problem: ProblemRecord, messageText: string) => {
    message.success(messageText);
    if (onCreated) {
      await onCreated(problem);
    }
    setEditorContent(defaultTemplate());
    setActiveTab("upload");
    onClose();
  };

  const handleComposeSubmit = async () => {
    if (validationIssues.length) {
      message.error("Fix template issues before saving the problem.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await problemApi.createProblemFromContent(editorContent);
      await handleSuccess(response.problem, "Problem saved successfully.");
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".md",
    beforeUpload: async (file) => {
      if (isSubmitting) {
        return Upload.LIST_IGNORE;
      }

      try {
        setIsSubmitting(true);
        const text = await file.text();
        const validation = validateProblemMarkdown(text);
        if (!validation.isValid) {
          const issues = validation.issues
            .map((issue) => (typeof issue === "string" ? issue : issue.message))
            .join("\n");
          message.error("Upload failed.\n" + issues);
          return Upload.LIST_IGNORE;
        }

        const response = await problemApi.uploadProblemFile(file);
        await handleSuccess(response.problem, "Problem uploaded successfully.");
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }

      return Upload.LIST_IGNORE;
    },
    onDrop: () => {
      setActiveTab("upload");
    },
    disabled: isSubmitting,
    showUploadList: false,
  };

  const tabItems: TabsProps["items"] = [
    {
      key: "upload",
      label: "Upload markdown",
      children: (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Paragraph>
            Drop a prepared <Text code>.md</Text> file that follows the
            CodeBattle problem template. The file manager will validate the
            structure before storing it.
          </Paragraph>
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 32 }} />
            </p>
            <p className="ant-upload-text">
              Click or drag markdown file to this area
            </p>
            <p className="ant-upload-hint">
              Only validated templates will be accepted.
            </p>
          </Upload.Dragger>
        </Space>
      ),
    },
    {
      key: "compose",
      label: "Compose in editor",
      children: (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Paragraph>
            Start from the canonical template, fill in each section, and verify
            the structure before saving. Slug and other metadata are derived
            from the template front matter.
          </Paragraph>
          <Space>
            <Button
              onClick={() => setEditorContent(defaultTemplate())}
              disabled={isSubmitting}
            >
              Reset to template
            </Button>
            <Button
              type="primary"
              onClick={handleComposeSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || validationIssues.length > 0}
            >
              Save problem
            </Button>
          </Space>
          {validationIssues.length ? (
            renderValidationIssues(validationIssues)
          ) : (
            <Alert
              type="success"
              message="Template passes validation"
              showIcon
            />
          )}
          <TextArea
            value={editorContent}
            onChange={(event) => setEditorContent(event.target.value)}
            autoSize={{ minRows: 16, maxRows: 32 }}
            spellCheck={false}
            style={{ fontFamily: "monospace" }}
            disabled={isSubmitting}
          />
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={() => {
        setActiveTab("upload");
        setIsSubmitting(false);
      }}
      title={
        <Title level={4} style={{ marginBottom: 0 }}>
          Add problem
        </Title>
      }
      footer={null}
      destroyOnClose
      width={720}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "upload" | "compose")}
        items={tabItems}
      />
    </Modal>
  );
};
