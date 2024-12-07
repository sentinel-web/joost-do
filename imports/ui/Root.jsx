import { App, ConfigProvider, Layout } from "antd";
import React from "react";
import Todos from "./Todos";

const Root = () => {
  const layoutStyle = {
    minHeight: "100vh",
    minWidth: "100vw",
    display: "flex",
    flexDirection: "column",
  };
  const contentStyle = {
    padding: "20px",
    flex: "1 1 auto",
    maxHeight: "calc(100vh)",
    maxWidth: "calc(100vw)",
    overflow: "auto",
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorSuccess: "#00ff00",
          colorError: "#ff0000",
          colorWarning: "#fadb14",
          colorPrimary: "#0000ff",
          colorInfo: "#0000ff",
          colorTextBase: "#0f0f0f",
          colorBgBase: "#f0f0f0",
          fontSize: 12,
          borderRadius: 8,
          wireframe: true,
          fontFamily: "monospace",
        },
      }}
    >
      <App message={{ maxCount: 3 }} notification={{ stack: { threshold: 1 } }}>
        <Layout style={layoutStyle}>
          <Layout.Content style={contentStyle}>
            <Todos />
          </Layout.Content>
        </Layout>
      </App>
    </ConfigProvider>
  );
};

export default Root;
