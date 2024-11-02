# Memo

Memo 是一个笔记应用，提供笔记的增删改查功能。

## 功能特点

- 创建、搜索、修改和删除笔记
- 热力图显示笔记创建活跃度
- 响应式设计，支持移动端和桌面端

## 在线演示

项目已部署至 [Vercel](https://memo-rosy.vercel.app/memo)

## 技术栈

- 前端：React, TypeScript, Vite
- 后端：Node.js, Hono
- 数据库：MongoDB
- 部署：Vercel

## 安装

1. 克隆仓库
   ```
   git clone https://github.com/c7uge3/memo.git
   cd memo
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 设置环境变量
   创建 `.env` 文件，并添加以下内容：
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. 运行开发服务器
   ```
   npm run dev
   ```

## 使用说明

1. 创建笔记：在编辑器中输入内容，点击发送按钮。
2. 搜索笔记：在搜索框中输入关键词，按回车键搜索。
3. 修改笔记：点击笔记右上角的编辑图标（或双击笔记条目），编辑后点击保存按钮。
4. 删除笔记：点击笔记右上角的删除图标。
5. 查看活跃度：在侧边栏的热力图中查看笔记创建活跃度，点击热力图中的日期可以查看该日期的所有笔记。

## 部署

本项目使用 Vercel 进行部署。要部署您自己的版本：

1. 在 Vercel 上创建一个新项目。
2. 连接您的 GitHub 仓库。
3. 设置环境变量 `MONGODB_URI`。
4. 部署。

## 许可证

本项目采用 MIT 许可证。详情请见 [LICENSE](LICENSE) 文件。
