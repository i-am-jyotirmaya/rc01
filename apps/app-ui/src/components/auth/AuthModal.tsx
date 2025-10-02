import { Alert, Button, Form, Input, Space, Typography } from "antd";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { AppModal } from "../common/AppModal";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  closeLoginModal,
  setAuthMode,
  submitLogin,
  submitRegistration,
  type AuthUiMode,
  type LoginFormValues,
  type RegisterFormValues,
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

export const AuthModal: FC = () => {
  const [loginForm] = Form.useForm<LoginFormValues>();
  const [registerForm] = Form.useForm<RegisterFormValues>();
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectIsAuthModalOpen);
  const mode = useAppSelector(selectAuthMode);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isSubmitting = status === "submitting";

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
      void dispatch(submitLogin(values));
    },
    [dispatch],
  );

  const handleRegisterFinish = useCallback(
    (values: RegisterFormValues) => {
      void dispatch(submitRegistration(values));
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
              ? "Please enter the credentials associated with your account."
              : "A few quick details and you will be ready to join the action."}
          </Typography.Text>
        </div>

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
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Enter the email you use to sign in." },
                { type: "email", message: "That does not look like a valid email address." },
              ]}
            >
              <Input type="email" placeholder="you@example.com" autoFocus allowClear />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "A password is required." },
                { min: 8, message: "Passwords need to be at least 8 characters long." },
              ]}
            >
              <Input.Password placeholder="Enter your password" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={isSubmitting}>
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
              label="Full name"
              name="fullName"
              rules={[{ required: true, message: "Let us know how to address you." }]}
            >
              <Input placeholder="Jane Doe" autoFocus allowClear />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Enter an email so we can reach you." },
                { type: "email", message: "That does not look like a valid email address." },
              ]}
            >
              <Input type="email" placeholder="you@example.com" allowClear />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Choose a password." },
                { min: 8, message: "Create a password with at least 8 characters." },
              ]}
            >
              <Input.Password placeholder="Create a password" autoComplete="new-password" />
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
              <Input.Password placeholder="Repeat your password" autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={isSubmitting}>
              Create account
            </Button>
          </Form>
        )}

        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {mode === "login" ? (
            <>
              New here?
              <Button type="link" onClick={() => handleModeSwitch("register")} style={{ padding: 0 }}>
                Create an account
              </Button>
            </>
          ) : (
            <>
              Already have an account?
              <Button type="link" onClick={() => handleModeSwitch("login")} style={{ padding: 0 }}>
                Log in instead
              </Button>
            </>
          )}
        </Typography.Paragraph>
      </Space>
    </AppModal>
  );
};
