import React, { useState } from "react";
import Loading from "./Common/loading";

/**
 * Dify 组件，用于接入 Dify 聊天机器人
 * @returns Dify 页面
 */
function Dify() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <main className='content-div'>
      {isLoading && (
        <Loading spinning={true} indicator={<>🤖 Dify bot 正在生成...</>} />
      )}
      <iframe
        src='https://udify.app/chatbot/GHotKYtaZDK8HEpO'
        style={{
          width: "100%",
          height: "100%",
          minHeight: "700px",
          display: isLoading ? "none" : "block",
        }}
        frameBorder='0'
        allow='microphone'
        onLoad={() => setIsLoading(false)}></iframe>
    </main>
  );
}

export default Dify;
