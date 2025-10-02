import { Form, Input, Modal, Space, Typography, Button, message, theme } from "antd";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { HeroIconKey } from "../../features/arena/arenaSlice";
import { IconFactory } from "../common/IconFactory";

interface GetStartedFlowProps {
  label: string;
  icon: HeroIconKey;
}

const inviteLinkPattern = /^(https?:\/\/\S+|[A-Z0-9-]{6,})$/i;

export const GetStartedFlow: FC<GetStartedFlowProps> = ({ label, icon }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinForm] = Form.useForm<{ inviteLink: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const helperTextStyle = useMemo(
    () => ({
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
    }),
    [token],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    joinForm.resetFields();
  }, [joinForm]);

  const handleJoin = useCallback(async () => {
    try {
      const { inviteLink } = await joinForm.validateFields();
      message.success(`Attempting to join with ${inviteLink}`);
    } catch {
      // Ant Design surfaces validation issues inline; no additional handling required here.
    }
  }, [joinForm]);

  const handleHostNavigate = useCallback(() => {
    closeModal();
    navigate("/host");
  }, [closeModal, navigate]);

  return (
    <>
      <Button
        type="primary"
        size="large"
        icon={<IconFactory icon={icon} />}
        onClick={() => setIsModalOpen(true)}
      >
        {label}
      </Button>
      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        title="Jump into a battle"
        width={720}
        style={{ maxWidth: "90vw" }}
        destroyOnClose
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Form layout="vertical" form={joinForm}>
            <Form.Item label="Invite link or code" required style={{ marginBottom: token.marginXS }}>
              <Space.Compact style={{ width: "100%" }}>
                <Form.Item
                  name="inviteLink"
                  noStyle
                  rules={[
                    { required: true, message: "Enter a battle invite link or code." },
                    {
                      pattern: inviteLinkPattern,
                      message: "Use a full URL or a code like BTL-1234.",
                    },
                  ]}
                >
                  <Input placeholder="https://arena.gg/battle/abc or BTL-1234" allowClear />
                </Form.Item>
                <Button type="primary" onClick={handleJoin}>
                  Join
                </Button>
              </Space.Compact>
            </Form.Item>
          </Form>
          <Typography.Text style={helperTextStyle}>
            Accepts secure https links or invite codes (e.g. BTL-9821, TEAM-01).
          </Typography.Text>
          <Button type="default" block onClick={handleHostNavigate}>
            Host your own battle
          </Button>
        </Space>
      </Modal>
    </>
  );
};


