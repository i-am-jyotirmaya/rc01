import { UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Space, Typography, Upload, theme } from "antd";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import type { UploadFile } from "antd/es/upload/interface";
import type { RegisterRequestPayload } from "@rc01/api-client";
import { AppModal } from "../common/AppModal";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  closeLoginModal,
  setAuthMode,
  submitLogin,
  submitRegistration,
  type AuthUiMode,
  type LoginFormValues,
} from "../../features/auth/authSlice";
import {
  selectAuthError,
  selectAuthMode,
  selectAuthStatus,
  selectIsAuthModalOpen,
} from "../../features/auth/selectors";

const titleByMode: Record<AuthUiMode, string> = {
  login: "Welcome back",
  register: "Create your account",
};

type RegisterFormValues = {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  photo?: UploadFile[];
};

const normalizeUploadValue = (value: unknown): UploadFile[] => {
  if (Array.isArray(value)) {
    return value as UploadFile[];
  }

  if (value && typeof value === "object" && "fileList" in value) {
    const fileList = (value as { fileList?: UploadFile[] }).fileList ?? [];
    return fileList.slice(-1);
  }

  return [];
};

export const AuthModal: FC = () => {
  const [loginForm] = Form.useForm<LoginFormValues>();
  const [registerForm] = Form.useForm<RegisterFormValues>();
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectIsAuthModalOpen);
  const mode = useAppSelector(selectAuthMode);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isSubmitting = status === "submitting";
  const { token } = theme.useToken();

  useEffect(() => {
    if (!open) {
      loginForm.resetFields();
      registerForm.resetFields();
    }
  }, [open, loginForm, registerForm]);

  const handleCancel = useCallback(() => {
    dispatch(closeLoginModal());
  }, [dispatch]);

  const handleModeSwitch = useCallback(
    (nextMode: AuthUiMode) => {
      dispatch(setAuthMode(nextMode));
    },
    [dispatch],
  );

  const handleLoginFinish = useCallback(
    (values: LoginFormValues) => {
      const payload: LoginFormValues = {
        username: values.username.trim(),
        password: values.password,
      };
      void dispatch(submitLogin(payload));
    },
    [dispatch],
  );

  const handleRegisterFinish = useCallback(
    (values: RegisterFormValues) => {
      const request: RegisterRequestPayload = {
        username: values.username.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        password: values.password,
      };

      const file = values.photo?.[0]?.originFileObj;
      if (file) {
        request.photo = file as File;
      }

      void dispatch(submitRegistration(request));
    },
    [dispatch],
  );

  return (
    <AppModal
      title={titleByMode[mode]}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={480}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Text type="secondary">
            {mode === "login"
              ? "Please enter your username and password to continue."
              : "Share a few quick details to set up your arena profile."}
          </Typography.Text>
        </div>

        <Typography.Paragraph
          style={{
            marginBottom: 0,
            color: token.colorTextQuaternary,
            fontSize: token.fontSizeSM,
          }}
        >
          Heads-up: your account information stays on this device; we keep it local.
        </Typography.Paragraph>

        {error ? <Alert type="error" message={error} showIcon /> : null}

        {mode === "login" ? (
          <Form
            form={loginForm}
            layout="vertical"
            onFinish={handleLoginFinish}
            autoComplete="on"
            requiredMark="optional"
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Enter your username." },
                {
                  min: 3,
                  message: "Usernames need to be at least 3 characters long.",
                },
                { max: 64, message: "Usernames cannot exceed 64 characters." },
              ]}
            >
              <Input
                placeholder="your_username"
                autoFocus
                allowClear
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "A password is required." },
                {
                  min: 8,
                  message: "Passwords need to be at least 8 characters long.",
                },
              ]}
            >
              <Input.Password
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isSubmitting}
            >
              Log in
            </Button>
          </Form>
        ) : (
          <Form
            form={registerForm}
            layout="vertical"
            onFinish={handleRegisterFinish}
            autoComplete="on"
            requiredMark="optional"
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Choose a username." },
                {
                  min: 3,
                  message: "Usernames need to be at least 3 characters long.",
                },
                { max: 64, message: "Usernames cannot exceed 64 characters." },
              ]}
            >
              <Input
                placeholder="your_username"
                autoFocus
                allowClear
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              label="First name"
              name="firstName"
              rules={[
                { required: true, message: "Tell us your first name." },
                { max: 120, message: "Keep it under 120 characters." },
              ]}
            >
              <Input placeholder="Jane" allowClear autoComplete="given-name" />
            </Form.Item>
            <Form.Item
              label="Last name"
              name="lastName"
              rules={[
                { required: true, message: "What is your last name?" },
                { max: 120, message: "Keep it under 120 characters." },
              ]}
            >
              <Input placeholder="Doe" allowClear autoComplete="family-name" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Choose a password." },
                {
                  min: 8,
                  message: "Create a password with at least 8 characters.",
                },
              ]}
            >
              <Input.Password
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              label="Confirm password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm your password." },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match."));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              label="Profile photo"
              name="photo"
              valuePropName="fileList"
              getValueFromEvent={normalizeUploadValue}
              extra="Optional. Upload a PNG or JPG image (max 5 MB)."
            >
              <Upload
                beforeUpload={() => false}
                accept="image/png,image/jpeg"
                maxCount={1}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Select image</Button>
              </Upload>
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isSubmitting}
            >
              Create account
            </Button>
          </Form>
        )}

        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {mode === "login" ? (
            <>
              New here?
              <Button
                type="link"
                onClick={() => handleModeSwitch("register")}
                style={{ padding: 0 }}
              >
                Create an account
              </Button>
            </>
          ) : (
            <>
              Already have an account?
              <Button
                type="link"
                onClick={() => handleModeSwitch("login")}
                style={{ padding: 0 }}
              >
                Log in instead
              </Button>
            </>
          )}
        </Typography.Paragraph>
      </Space>
    </AppModal>
  );
};

