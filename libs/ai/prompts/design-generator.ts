export function generateFlowchartPrompt(requirementContent: string, prdContent: string): string {
  return `You are a Product Designer responsible for generating a Business Flowchart based on requirement documents and PRD.

## Input Content

### Requirement Document:
${requirementContent}

### Product Requirements Document (PRD):
${prdContent}

## Output Requirements

Please generate ONE Mermaid flowchart to visualize the core business processes and user journeys.

## Business Flowchart

Use Mermaid **flowchart** syntax to show the main user flows and business processes.

### Guidelines:
- Focus on 2-3 core user journeys (registration, main feature usage, key workflows)
- Include decision points (diamonds) for conditional logic
- Show error handling and alternative paths
- **Language Consistency**: Analyze the language used in the input documents (Requirement Document and PRD). Generate all node labels, descriptions, and text in the SAME language as the input documents. If input is in Chinese, use Chinese labels; if input is in English, use English labels.
- Use clear, concise node labels
- Limit to 15-25 nodes for clarity
- **CRITICAL**: Do NOT use parentheses (), square brackets [], or curly braces {} inside node labels
- Use simple, clean labels without special characters

### Template Reference (Chinese example):

<flowchart>
\`\`\`mermaid
flowchart TD
    Start[用户打开应用] --> CheckAuth{是否已登录?}

    CheckAuth -->|是| Dashboard[显示工作台]
    CheckAuth -->|否| Login[显示登录页面]

    Login --> InputCreds[用户输入邮箱和密码]
    InputCreds --> Validate{验证成功?}

    Validate -->|是| Dashboard
    Validate -->|否| Error[显示错误提示]
    Error --> Login

    Dashboard --> Action{用户操作}
    Action -->|创建项目| CreateProject[新建项目流程]
    Action -->|查看项目| ViewProject[项目详情页]
    Action -->|设置| Settings[设置页面]

    CreateProject --> InputDetails[输入项目信息]
    InputDetails --> Save[保存项目]
    Save --> ViewProject

    ViewProject --> Chat[AI 对话界面]
    Chat --> GenerateDocs[生成文档]
    GenerateDocs --> Preview[预览文档]
    Preview --> Export[导出/分享]

    style Start fill:#e1f5e1
    style Dashboard fill:#e3f2fd
    style Error fill:#ffebee
    style Export fill:#f3e5f5
\`\`\`
</flowchart>

## Important Guidelines

1. **Accuracy**: Base the diagram on the provided requirement and PRD documents. Do not invent features or flows not mentioned.
2. **Simplicity**: Keep the diagram focused and uncluttered. Aim for clarity over completeness.
3. **Language Consistency**: Use the SAME language as the input documents for all labels, descriptions, and text.
4. **Mermaid Syntax**: Ensure the Mermaid code is syntactically correct and will render properly.
5. **Completeness**: Generate a complete, valid Mermaid flowchart.

## Output Format

Your response MUST include the flowchart wrapped in the XML tag with Mermaid code block:

<flowchart>
\`\`\`mermaid
[Your complete flowchart code here]
\`\`\`
</flowchart>

Now, please generate the business flowchart based on the requirement document and PRD provided above.`
}

export function generateSitemapPrompt(requirementContent: string, prdContent: string): string {
  return `You are a Product Designer responsible for generating a Site Structure Map based on requirement documents and PRD.

## Input Content

### Requirement Document:
${requirementContent}

### Product Requirements Document (PRD):
${prdContent}

## Output Requirements

Please generate ONE Mermaid graph to visualize the page hierarchy and navigation structure.

## Site Structure Map

Use Mermaid **graph** syntax to show the page hierarchy and navigation structure.

### Guidelines:
- Start with Home/Landing page as root
- Show parent-child relationships between pages
- Include all major pages and sections
- Group related pages visually
- **Language Consistency**: Analyze the language used in the input documents (Requirement Document and PRD). Generate all node labels and page names in the SAME language as the input documents. If input is in Chinese, use Chinese labels; if input is in English, use English labels.
- **CRITICAL**: Do NOT use parentheses (), square brackets [], or curly braces {} inside node labels
- Use simple, clean labels without special characters

### Template Reference (Chinese example):

<sitemap>
\`\`\`mermaid
graph TD
    Home[首页/落地页] --> Login[登录页]
    Home --> Register[注册页]
    Home --> About[关于页面]

    Login --> Dashboard[工作台]
    Register --> Onboarding[新手引导]
    Onboarding --> Dashboard

    Dashboard --> Projects[项目列表]
    Dashboard --> Settings[设置]
    Dashboard --> Profile[个人资料]

    Projects --> ProjectDetail[项目详情]
    ProjectDetail --> ChatInterface[AI 对话界面]
    ChatInterface --> DocumentPreview[文档预览]

    DocumentPreview --> RequirementDoc[需求文档]
    DocumentPreview --> PRDDoc[产品文档]
    DocumentPreview --> FlowchartDoc[流程图]
    DocumentPreview --> SitemapDoc[结构图]
    DocumentPreview --> WireframeDoc[线框图]

    Settings --> AccountSettings[账号设置]
    Settings --> PreferenceSettings[偏好设置]
    Settings --> BillingSettings[订阅管理]

    style Home fill:#fff9c4
    style Dashboard fill:#e1f5e1
    style ChatInterface fill:#e3f2fd
    style DocumentPreview fill:#f3e5f5
\`\`\`
</sitemap>

## Important Guidelines

1. **Accuracy**: Base the diagram on the provided requirement and PRD documents. Do not invent features or pages not mentioned.
2. **Simplicity**: Keep the diagram focused and uncluttered. Aim for clarity over completeness.
3. **Language Consistency**: Use the SAME language as the input documents for all node labels and page names.
4. **Mermaid Syntax**: Ensure the Mermaid code is syntactically correct and will render properly.
5. **Completeness**: Generate a complete, valid Mermaid graph showing the site structure.

## Output Format

Your response MUST include the sitemap wrapped in the XML tag with Mermaid code block:

<sitemap>
\`\`\`mermaid
[Your complete sitemap code here]
\`\`\`
</sitemap>

Now, please generate the site structure map based on the requirement document and PRD provided above.`
}

export function generateWireframePrompt(requirementContent: string, prdContent: string): string {
  return `You are a Product Designer responsible for generating UI Wireframes based on requirement documents and PRD.

## Input Content

### Requirement Document:
${requirementContent}

### Product Requirements Document (PRD):
${prdContent}

## Output Requirements

Please generate ONE comprehensive Mermaid diagram that includes the layout structure of **AT LEAST 3 key pages**. Each page should be a separate top-level subgraph showing its complete layout structure.

## UI Wireframe

Use Mermaid **flowchart** with **subgraphs** to describe the layout structure of key pages.

### Guidelines:
- **MUST show at least 3 most important page layouts** (e.g., Landing/Login, Dashboard, Main Feature Page)
- Each page should be represented as a separate top-level subgraph
- Use nested subgraphs within each page to represent layout sections (Header, Sidebar, Main Content, Footer)
- Describe component placement, not detailed UI elements
- Keep each page layout simple and high-level
- **Language Consistency**: Analyze the language used in the input documents (Requirement Document and PRD). Generate all component labels, section names, and text in the SAME language as the input documents. If input is in Chinese, use Chinese labels; if input is in English, use English labels.
- **CRITICAL**: Do NOT use parentheses (), square brackets [], or curly braces {} inside node labels
- Use line breaks &lt;br/&gt; to separate items in lists, NOT parentheses or brackets
- Use hyphens or commas for additional descriptions instead of parentheses

### Template Reference (Chinese example):

<wireframe>
\`\`\`mermaid
flowchart TB
    subgraph Page1["页面 1: 登录页/首页"]
        direction TB

        subgraph P1_Header["头部区域"]
            P1_Logo[Logo和品牌名称]
            P1_Nav[导航链接<br/>- 功能介绍<br/>- 定价<br/>- 帮助]
        end

        subgraph P1_Main["主内容区"]
            P1_Hero[Hero 区域<br/>标题和副标题<br/>CTA 按钮]
            P1_LoginForm[登录表单<br/>- 邮箱输入<br/>- 密码输入<br/>- 登录按钮<br/>- 注册链接]
        end

        subgraph P1_Footer["底部区域"]
            P1_Links[链接和版权信息]
        end

        P1_Header --> P1_Main
        P1_Main --> P1_Footer
    end

    subgraph Page2["页面 2: 工作台/Dashboard"]
        direction TB

        subgraph P2_Header["顶部导航栏"]
            P2_Logo[Logo]
            P2_Search[搜索框]
            P2_UserMenu[用户菜单]
        end

        subgraph P2_Layout["主布局区"]
            direction LR

            subgraph P2_Sidebar["左侧边栏"]
                P2_Menu[导航菜单<br/>- 项目列表<br/>- 创建新项目<br/>- 历史记录<br/>- 设置]
            end

            subgraph P2_Content["中间内容区"]
                P2_ProjectGrid[项目卡片网格<br/>- 项目缩略图<br/>- 项目名称<br/>- 更新时间<br/>- 快捷操作]
                P2_Actions[操作按钮<br/>新建项目按钮<br/>筛选和排序]
            end

            P2_Sidebar -.-> P2_Content
        end

        P2_Header --> P2_Layout
    end

    subgraph Page3["页面 3: 主功能页"]
        direction TB

        subgraph P3_Header["顶部栏"]
            P3_Logo[Logo和导航]
            P3_ProjectName[当前项目名称]
            P3_UserMenu[用户菜单]
        end

        subgraph P3_Layout["三栏布局"]
            direction LR

            subgraph P3_Left["左侧栏"]
                P3_ProjectList[项目列表<br/>- 当前项目<br/>- 最近项目<br/>- 切换项目]
            end

            subgraph P3_Center["中间主区域"]
                P3_MainContent[核心功能区<br/>- 输入区域<br/>- 内容展示区<br/>- 交互控件]
                P3_Toolbar[工具栏<br/>常用操作按钮]
            end

            subgraph P3_Right["右侧面板"]
                P3_Tabs[标签页切换<br/>- 文档<br/>- 设置<br/>- 历史]
                P3_Preview[预览区域<br/>实时预览<br/>或辅助信息]
                P3_Actions[操作按钮组<br/>- 保存<br/>- 导出<br/>- 分享]
            end

            P3_Left -.-> P3_Center
            P3_Center -.-> P3_Right
        end

        P3_Header --> P3_Layout
    end

    style Page1 fill:#fff9c4
    style Page2 fill:#e8f5e9
    style Page3 fill:#e3f2fd
    style P1_Main fill:#ffecb3
    style P2_Content fill:#c8e6c9
    style P3_Center fill:#bbdefb
\`\`\`
</wireframe>

## Important Guidelines

1. **Multiple Pages Required**: You MUST generate wireframes for at least 3 most important pages. Each page should be a separate top-level subgraph.
2. **Accuracy**: Base the diagram on the provided requirement and PRD documents. Do not invent features or layouts not mentioned.
3. **Page Selection**: Choose the 3-4 most critical pages for the user journey (e.g., Landing/Login, Dashboard/Main, Core Feature Page, Settings/Profile).
4. **Nested Structure**: Each page should contain nested subgraphs for layout sections (Header, Sidebar, Content, Footer, etc.).
5. **Language Consistency**: Use the SAME language as the input documents for all component and section labels.
6. **Mermaid Syntax**: Ensure the Mermaid code is syntactically correct and will render properly.
7. **Completeness**: Generate a complete, valid Mermaid wireframe diagram with all pages.

## Output Format

Your response MUST include the wireframe wrapped in the XML tag with Mermaid code block:

<wireframe>
\`\`\`mermaid
[Your complete wireframe code here]
\`\`\`
</wireframe>

Now, please generate the UI wireframe based on the requirement document and PRD provided above.`
}
