#!/bin/bash

# 要处理的文件列表 - 第一组：import React, { ... } 的文件
files1=(
  "src/components/AppRoutes.tsx"
  "src/components/Memo/MemoSearch.tsx"
  "src/components/Nav/Heatmap.tsx"
  "src/components/Common/LazyReactQuill.tsx"
  "src/components/Memo/MemoEditor.tsx"
  "src/components/Memo/MemoItem.tsx"
  "src/components/Nav/SideBar.tsx"
  "src/components/Memo/MemoList.tsx"
)

# 要处理的文件列表 - 第二组：import React from "react" 的文件
files2=(
  "src/components/Common/loading/loading.tsx"
  "src/components/Common/alert/alert.tsx"
  "src/components/Auth/ProtectedRoute.tsx"
  "src/components/Common/emptyBox/emptyBox.tsx"
)

# 处理第一组文件
for file in "${files1[@]}"; do
  sed -i '' 's/import React, {/import {/' "$file"
done

# 处理第二组文件
for file in "${files2[@]}"; do
  # 删除 React 导入行
  sed -i '' '/^import React from "react";/d' "$file"
done
