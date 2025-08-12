# Jotlin

> 💡Note: The project is still in its early stages,your interest and contributions are welcome.

### 👀Key Features：

- Jotlin is an open-source version of Notion, but it incorporates the capabilities of LLM throughout the writing process.
  - Notion-like editor experience.
  - Before writing, AI automatically assists in retrieving information.
  - During writing, it generates content.
  - After writing is completed, it automatically generates intelligent Q&A and summaries for the article's knowledge base.

- Enterprises can deploy it in a private cloud environment to ensure data security and support team collaboration and permission control capabilities.

![image-20240412204148692](https://raw.githubusercontent.com/mlhiter/typora-images/master/202404122041888.png)

![image-20240412204109849](https://raw.githubusercontent.com/mlhiter/typora-images/master/202404122041156.png)

### 👜Technology stack：

NextJS + Shadcn-UI + BlockNote + Prisma

### 🤔Road Map：

1. Basic editor capabilities
   - [ ] Support common block and inline styles
   - [ ] Support Kanban and mention
   - [ ] Optimize editor performance
   - [ ] Improve markdown syntax import and export
   - [ ] meta information support
2. Advanced editor capabilities
   - [ ] notion like database
   - [ ] template
3. LLM integration
   1. [FastGPT](https://github.com/labring/FastGPT) integration
      1. [ ] Knowledge base support
      2. [ ] Text reader support
      3. [ ] database integration to ai work flow
   2. Writing AI assistant
      - [ ] basic AI-assistant chat use Apikey
      - [ ] retrieving information with LLM
      - [ ] basic generates content feature
      - [ ] intelligent Q&A with your article and knowledge base
      - [ ] AI-label and content summarize
4. Team Collaboration
   - [ ] Memeber management
5. Devops capabilities
   - [ ] Deploy to docker
   - [ ] Deploy to [sealos](https://github.com/labring/sealos)

### 🥰 Thanks to：

- [Antonio](https://github.com/AntonioErdeljac)(his tutorial helps me so much)
- This project is base in a tutorial project from him,and it will go further.[His website](https://www.codewithantonio.com/)
- [BlockNote](https://github.com/TypeCellOS/BlockNote)
  - Support core block editor,saved me so much time.
