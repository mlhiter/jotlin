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
- Use clear, concise node labels in Chinese
- Limit to 15-25 nodes for clarity
- **CRITICAL**: Do NOT use parentheses (), square brackets [], or curly braces {} inside node labels
- Use simple, clean labels without special characters

### Template:

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
3. **Chinese Labels**: Use Chinese for all node labels, descriptions, and text.
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
- Use Chinese labels
- **CRITICAL**: Do NOT use parentheses (), square brackets [], or curly braces {} inside node labels
- Use simple, clean labels without special characters

### Template:

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
3. **Chinese Labels**: Use Chinese for all node labels and page names.
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

Please generate ONE Mermaid diagram to visualize the layout structure of key pages.

## UI Wireframe

Use Mermaid **flowchart** with **subgraphs** to describe the layout structure of key pages.

### Guidelines:
- Show 2-3 most important page layouts (e.g., Dashboard, Main Feature Page, Document View)
- Use subgraphs to represent different layout sections (Header, Sidebar, Main Content, Footer)
- Describe component placement, not detailed UI elements
- Keep it simple and high-level
- **CRITICAL**: Do NOT use parentheses (), square brackets [], or curly braces {} inside node labels
- Use line breaks `<br/>` to separate items in lists, NOT parentheses or brackets
- Use hyphens or commas for additional descriptions instead of parentheses

### Template:

<wireframe>
\`\`\`mermaid
flowchart TB
    subgraph Header["页面头部 (Header)"]
        Logo[Logo] --- Nav[导航菜单] --- UserMenu[用户菜单]
    end

    subgraph MainLayout["主要布局区"]
        direction LR

        subgraph Sidebar["左侧边栏"]
            ProjectList[项目列表<br/>- 当前项目<br/>- 历史项目<br/>- 新建按钮]
        end

        subgraph Content["中间内容区"]
            ChatArea[AI 对话区域<br/>- 消息列表<br/>- 输入框<br/>- 文件上传]
        end

        subgraph RightPanel["右侧面板"]
            DocTabs[文档标签页<br/>- 需求文档<br/>- PRD<br/>- 流程图<br/>- 结构图<br/>- 线框图]
            VersionSelect[版本选择器]
            PreviewArea[文档预览区<br/>Markdown 渲染<br/>或 Mermaid 图表]
            Actions[操作按钮<br/>- 复制<br/>- 导出<br/>- 分享]
        end

        Sidebar -.-> Content
        Content -.-> RightPanel
    end

    subgraph Footer["页面底部 (Footer)"]
        Copyright[版权信息] --- Links[帮助链接] --- Social[社交媒体]
    end

    Header --> MainLayout
    MainLayout --> Footer

    style Header fill:#e3f2fd
    style Sidebar fill:#f3e5f5
    style Content fill:#e8f5e9
    style RightPanel fill:#fff9c4
    style Footer fill:#fce4ec
\`\`\`
</wireframe>

## Important Guidelines

1. **Accuracy**: Base the diagram on the provided requirement and PRD documents. Do not invent features or layouts not mentioned.
2. **Simplicity**: Keep the diagram focused on 2-3 most important pages. Use subgraphs for different sections.
3. **Chinese Labels**: Use Chinese for all component and section labels.
4. **Mermaid Syntax**: Ensure the Mermaid code is syntactically correct and will render properly.
5. **Completeness**: Generate a complete, valid Mermaid wireframe diagram.

## Output Format

Your response MUST include the wireframe wrapped in the XML tag with Mermaid code block:

<wireframe>
\`\`\`mermaid
[Your complete wireframe code here]
\`\`\`
</wireframe>

Now, please generate the UI wireframe based on the requirement document and PRD provided above.`
}
