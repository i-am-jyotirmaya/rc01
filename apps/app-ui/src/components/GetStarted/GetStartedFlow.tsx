import { Form, Input, Modal, Space, Typography, Button, message, theme } from "antd";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import type { HeroIconKey } from "../../features/arena/arenaSlice";
import { IconFactory } from "../common/IconFactory";
import { HostBattleForm } from "./HostBattleForm";
import type { HostBattleFormValues } from "./HostBattleForm";

interface GetStartedFlowProps {
  label: string;
  icon: HeroIconKey;
}

const inviteLinkPattern = /^(https?:\/\/\S+|[A-Z0-9-]{6,})$/i;

export const GetStartedFlow: FC<GetStartedFlowProps> = ({ label, icon }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [joinForm] = Form.useForm<{ inviteLink: string }>();
  const [hostForm] = Form.useForm<HostBattleFormValues>();
  const { token } = theme.useToken();

  const helperTextStyle = useMemo(
    () => ({
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
    }),
    [token],
  );

  const closeModal = useCallback(() => {
    // Reset modal state so each launch starts with a clean slate.
    setIsModalOpen(false);
    setIsHosting(false);
    setShowAdvancedOptions(false);
    joinForm.resetFields();
    hostForm.resetFields();
  }, [hostForm, joinForm]);

  const handleJoin = useCallback(async () => {
    try {
      const { inviteLink } = await joinForm.validateFields();
      // TODO: Integrate with battle join endpoint once available.
      message.success(`Attempting to join with ${inviteLink}`);
    } catch (error) {
      // Ant Design surfaces validation issues inline; no additional handling required here.
    }
  }, [joinForm]);

  const handleHostSubmit = useCallback(
    async (values: HostBattleFormValues) => {
      // TODO: Replace mock handling with create-battle mutation.
      message.success(`Battle "${values.battleName}" configured`);
      closeModal();
    },
    [closeModal],
  );

  const handleHostAction = useCallback(() => {
    setIsHosting(true);
    // Ensures advanced options reset whenever the host flow re-opens.
    setShowAdvancedOptions(false);
  }, []);

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
          {!isHosting ? (
            <Button type="default" block onClick={handleHostAction}>
              Host your own battle
            </Button>
          ) : null}
          {isHosting ? (
            <>
              <Typography.Text strong>Configure your battle</Typography.Text>
              <HostBattleForm
                form={hostForm}
                showAdvanced={showAdvancedOptions}
                onToggleAdvanced={setShowAdvancedOptions}
                onSubmit={handleHostSubmit}
              />
            </>
          ) : null}
        </Space>
      </Modal>
    </>
  );
};
