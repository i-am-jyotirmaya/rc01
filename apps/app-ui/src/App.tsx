import { type FC, type JSX } from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Layout,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CodeOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import "./App.css";
import { lightThemeConfig } from "./themes/light-theme";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const App: FC = (): JSX.Element => {
  return (
    <ConfigProvider theme={lightThemeConfig}>
      <Layout className="app-shell">
        <Content className="hero">
          <div className="hero__inner">
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} lg={12}>
                <Space direction="vertical" size="large" className="hero__copy">
                  <Space className="hero__pills" size={[8, 8]} wrap>
                    <Tag className="hero__pill">Real-time battles</Tag>
                    <Tag className="hero__pill">Self-hostable</Tag>
                    <Tag className="hero__pill">Built for communities</Tag>
                  </Space>
                  <Title className="hero__title" level={1}>
                    CodeBattle Arena
                  </Title>
                  <Paragraph className="hero__subtitle">
                    A modern platform for rapid-fire coding competitions. Host
                    anything from intimate code-offs to large-scale tournaments
                    all within a delightful Ant Design experience.
                  </Paragraph>
                  <Space size="large" wrap>
                    <Button
                      type="primary"
                      size="large"
                      icon={<ThunderboltOutlined />}
                    >
                      Get Started
                    </Button>
                    <Button size="large" ghost>
                      Learn More
                    </Button>
                  </Space>
                  <Space size="large" className="hero__stats" wrap>
                    <div className="stat-chip">
                      <CodeOutlined className="stat-chip__icon" />
                      <div>
                        <span className="stat-chip__label">
                          Live Coding Arenas
                        </span>
                        <span className="stat-chip__value">
                          Battle-ready in seconds
                        </span>
                      </div>
                    </div>
                    <div className="stat-chip">
                      <TeamOutlined className="stat-chip__icon" />
                      <div>
                        <span className="stat-chip__label">Built for Teams</span>
                        <span className="stat-chip__value">
                          Host invite-only matches
                        </span>
                      </div>
                    </div>
                  </Space>
                </Space>
              </Col>
              <Col xs={24} lg={12}>
                <div className="hero__visual">
                  <div className="hero__orb hero__orb--left" />
                  <div className="hero__orb hero__orb--right" />
                  <div className="hero__glass">
                    <div className="glass__header">
                      <span className="glass__dot glass__dot--red" />
                      <span className="glass__dot glass__dot--yellow" />
                      <span className="glass__dot glass__dot--green" />
                    </div>
                    <pre className="glass__code">{`const arena = createArena({
  mode: "head-to-head",
  timeLimit: 180,
  language: "typescript",
});`}</pre>
                  </div>
                  <Card className="hero__feature-card" bordered={false}>
                    <Space size="middle">
                      <TrophyOutlined className="hero__feature-icon" />
                      <div>
                        <span className="feature-card__title">
                          Leaderboards and Spectator Mode
                        </span>
                        <span className="feature-card__subtitle">
                          Engage your community with live rankings and broadcasts.
                        </span>
                      </div>
                    </Space>
                  </Card>
                </div>
              </Col>
            </Row>
            <Row gutter={[24, 24]} className="hero__highlights">
              <Col xs={24} md={8}>
                <Card className="highlight-card" bordered={false}>
                  <Space size="middle" align="start">
                    <ThunderboltOutlined className="highlight-card__icon" />
                    <div>
                      <span className="highlight-card__title">Deploy in minutes</span>
                      <span className="highlight-card__description">
                        Launch real-time battles with ready-to-run templates and automated provisioning.
                      </span>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="highlight-card" bordered={false}>
                  <Space size="middle" align="start">
                    <CodeOutlined className="highlight-card__icon" />
                    <div>
                      <span className="highlight-card__title">Extend your stack</span>
                      <span className="highlight-card__description">
                        Connect custom judging, analytics, and bots through flexible integrations.
                      </span>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="highlight-card" bordered={false}>
                  <Space size="middle" align="start">
                    <TeamOutlined className="highlight-card__icon" />
                    <div>
                      <span className="highlight-card__title">Delight communities</span>
                      <span className="highlight-card__description">
                        Keep players engaged with brackets, team modes, and shareable recaps.
                      </span>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
