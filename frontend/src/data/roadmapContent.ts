export type ResourceType = 'docs' | 'course' | 'video' | 'article' | 'practice' | 'book'

export interface Resource {
  title: string
  url: string
  type: ResourceType
}

export interface TopicContent {
  summary: string
  resources: Resource[]
}

export interface RoadmapContent {
  tagline: string
  description: string
  skills: string[]
  languages: string[]
  frameworks: string[]
  tools: string[]
  topics: Record<string, TopicContent>
}

const docs = (title: string, url: string): Resource => ({ title, url, type: 'docs' })
const course = (title: string, url: string): Resource => ({ title, url, type: 'course' })
const article = (title: string, url: string): Resource => ({ title, url, type: 'article' })
const practice = (title: string, url: string): Resource => ({ title, url, type: 'practice' })
const book = (title: string, url: string): Resource => ({ title, url, type: 'book' })
const video = (title: string, url: string): Resource => ({ title, url, type: 'video' })

const topic = (summary: string, ...resources: Resource[]): TopicContent => ({ summary, resources })

const backend: RoadmapContent = {
  tagline: 'Build the servers, databases and APIs behind every app.',
  description:
    'Learn how requests travel across the web, then build reliable APIs backed by databases, caching, tests and a deployment pipeline.',
  skills: ['HTTP & networking', 'Go / Python / Node.js', 'SQL & Postgres', 'REST API design', 'Authentication', 'Redis caching', 'Testing', 'Docker', 'CI/CD', 'Git'],
  languages: ['Go', 'Python', 'JavaScript', 'Java', 'SQL'],
  frameworks: ['net/http', 'Gin', 'FastAPI', 'Django', 'Express', 'NestJS', 'Spring Boot'],
  tools: ['PostgreSQL', 'Redis', 'Docker', 'Git', 'GitHub Actions', 'Postman'],
  topics: {
    'How does the Internet work?': topic(
      'Devices talk through layers of networks: your request is split into packets, routed between ISPs, and reassembled by the server.',
      docs('How the web works (MDN)', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works'),
      article('What is the Internet? (Cloudflare)', 'https://www.cloudflare.com/learning/network-layer/how-does-the-internet-work/'),
    ),
    'HTTP/HTTPS': topic(
      'HTTP is the request/response protocol of the web; HTTPS wraps it in TLS so traffic is encrypted and the server is verified.',
      docs('An overview of HTTP (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview'),
      article('What is HTTPS? (Cloudflare)', 'https://www.cloudflare.com/learning/ssl/what-is-https/'),
      docs('HTTP status codes (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status'),
    ),
    DNS: topic(
      'DNS translates human-friendly names like example.com into IP addresses, using a hierarchy of resolvers and name servers.',
      article('What is DNS? (Cloudflare)', 'https://www.cloudflare.com/learning/dns/what-is-dns/'),
      article('How DNS works (comic)', 'https://howdns.works/'),
    ),
    'Browsers & Hosting basics': topic(
      'Browsers render HTML/CSS/JS; hosting is where your server code runs and is reachable on the internet.',
      docs('What is a web server? (MDN)', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server'),
      docs('Deploy to Fly.io', 'https://fly.io/docs/'),
    ),
    Go: topic(
      'A small, fast, statically typed language with great concurrency support. Ideal for APIs and cloud tooling.',
      course('A Tour of Go', 'https://go.dev/tour/'),
      practice('Go by Example', 'https://gobyexample.com/'),
      docs('Effective Go', 'https://go.dev/doc/effective_go'),
    ),
    Python: topic(
      'A readable, batteries-included language popular for web backends, scripting, data and AI.',
      docs('The Python Tutorial', 'https://docs.python.org/3/tutorial/'),
      course('Real Python tutorials', 'https://realpython.com/'),
    ),
    'Node.js': topic(
      'JavaScript on the server, built on an event loop that handles many connections efficiently.',
      docs('Introduction to Node.js', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs'),
      docs('Node.js API reference', 'https://nodejs.org/docs/latest/api/'),
    ),
    Java: topic(
      'A mature, statically typed JVM language widely used in enterprise backends.',
      course('Learn Java (dev.java)', 'https://dev.java/learn/'),
      docs('The Java Tutorials', 'https://docs.oracle.com/javase/tutorial/'),
    ),
    'C++': topic(
      'A high-performance systems language that gives fine control over memory; used in games, databases and infrastructure.',
      course('LearnCpp', 'https://www.learncpp.com/'),
      docs('cppreference', 'https://en.cppreference.com/'),
    ),
    C: topic(
      'The foundation of modern systems programming. Learning it teaches how memory and the OS really work.',
      course('Learn-C.org', 'https://www.learn-c.org/'),
      book("Beej's Guide to C", 'https://beej.us/guide/bgc/'),
    ),
    'Git fundamentals': topic(
      'Track changes, branch safely and collaborate: commits, branches, merges and rebases.',
      book('Pro Git (free book)', 'https://git-scm.com/book/en/v2'),
      practice('Learn Git Branching', 'https://learngitbranching.js.org/'),
    ),
    'GitHub/GitLab workflows': topic(
      'Collaborate through pull requests, code review and protected branches.',
      docs('GitHub flow', 'https://docs.github.com/en/get-started/using-github/github-flow'),
      docs('About pull requests', 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests'),
    ),
    'Relational databases (Postgres/MySQL)': topic(
      'Store structured data in tables, query it with SQL, and keep it consistent with transactions and constraints.',
      docs('PostgreSQL tutorial (official)', 'https://www.postgresql.org/docs/current/tutorial.html'),
      book('Use The Index, Luke', 'https://use-the-index-luke.com/'),
      practice('SQLBolt', 'https://sqlbolt.com/'),
    ),
    'NoSQL basics': topic(
      'Document, key-value, column and graph stores trade rigid schemas for flexibility and scale.',
      article('NoSQL explained (MongoDB)', 'https://www.mongodb.com/resources/basics/databases/nosql-explained'),
      docs('Redis getting started', 'https://redis.io/docs/latest/develop/get-started/'),
    ),
    'ORMs / query builders': topic(
      'Libraries that map database rows to code objects or build SQL safely, reducing boilerplate.',
      docs('sqlc: type-safe SQL for Go', 'https://sqlc.dev/'),
      docs('GORM docs', 'https://gorm.io/docs/'),
    ),
    'REST principles': topic(
      'Design APIs around resources, standard HTTP verbs, status codes and stateless requests.',
      article('REST API tutorial', 'https://restfulapi.net/'),
      docs('Google API design guide', 'https://cloud.google.com/apis/design'),
    ),
    'Authentication (JWT/OAuth)': topic(
      'Prove who a user is: password hashing and sessions or tokens (JWT), and delegated login with OAuth 2.0.',
      docs('Introduction to JWT', 'https://jwt.io/introduction'),
      docs('OAuth 2.0 simplified', 'https://www.oauth.com/'),
      docs('OWASP Authentication cheat sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'),
    ),
    'API testing': topic(
      'Verify endpoints return the right data, status codes and errors, manually and automatically.',
      docs('API testing with Postman', 'https://www.postman.com/api-platform/api-testing/'),
      docs('HTTPie CLI', 'https://httpie.io/docs/cli'),
    ),
    'Caching basics (Redis)': topic(
      'Keep hot data in memory to cut latency and database load. Learn cache-aside, TTLs and invalidation.',
      docs('Redis caching solutions', 'https://redis.io/solutions/caching/'),
      docs('Caching best practices (AWS)', 'https://aws.amazon.com/caching/best-practices/'),
    ),
    'Rate limiting': topic(
      'Protect your API from abuse by capping how many requests a client can make in a time window.',
      article('What is rate limiting? (Cloudflare)', 'https://www.cloudflare.com/learning/bots/what-is-rate-limiting/'),
      article('Rate limiting with Redis', 'https://redis.io/glossary/rate-limiting/'),
    ),
    'Unit testing': topic(
      'Test small pieces of logic in isolation so changes can be made with confidence.',
      docs('Go: add a test', 'https://go.dev/doc/tutorial/add-a-test'),
      article('Unit Test (Martin Fowler)', 'https://martinfowler.com/bliki/UnitTest.html'),
    ),
    'Integration testing': topic(
      'Test that components such as your code and a real database work together.',
      article('Integration Test (Martin Fowler)', 'https://martinfowler.com/bliki/IntegrationTest.html'),
      docs('Testcontainers', 'https://testcontainers.com/'),
    ),
    Docker: topic(
      'Package an app and its dependencies into a container that runs the same everywhere.',
      docs('Docker get started', 'https://docs.docker.com/get-started/'),
      docs('Build best practices', 'https://docs.docker.com/build/building/best-practices/'),
    ),
    'CI/CD basics': topic(
      'Automatically build, test and deploy every change so releases are small and safe.',
      docs('Understanding GitHub Actions', 'https://docs.github.com/en/actions/about-github-actions/understanding-github-actions'),
      article('CI vs CD vs deployment (Atlassian)', 'https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment'),
    ),
    'Cloud hosting basics': topic(
      'Run your API on managed platforms or virtual machines instead of your own hardware.',
      docs('Render docs', 'https://render.com/docs'),
      docs('Fly.io docs', 'https://fly.io/docs/'),
    ),
  },
}

const cloud: RoadmapContent = {
  tagline: 'Run, scale and secure applications on AWS, GCP and Azure.',
  description:
    'Understand how cloud platforms work, then learn compute, storage, networking, security and automation well enough to deploy real systems.',
  skills: ['Cloud models', 'AWS / GCP / Azure', 'Virtual machines', 'Containers & Kubernetes', 'Serverless', 'VPC networking', 'IAM & security', 'Monitoring', 'Cost control', 'Terraform'],
  languages: ['Bash', 'Python', 'Go', 'YAML', 'HCL'],
  frameworks: ['Terraform', 'Kubernetes', 'Helm', 'Ansible', 'AWS CDK', 'Pulumi'],
  tools: ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Prometheus', 'Grafana'],
  topics: {
    'What is cloud computing?': topic(
      'Renting computing power, storage and services over the internet on demand, paying only for what you use.',
      article('What is cloud computing? (AWS)', 'https://aws.amazon.com/what-is-cloud-computing/'),
      article('What is cloud computing? (Google Cloud)', 'https://cloud.google.com/learn/what-is-cloud-computing'),
    ),
    'IaaS vs PaaS vs SaaS': topic(
      'Three service levels: raw infrastructure (IaaS), a managed app platform (PaaS), or finished software (SaaS).',
      article('IaaS vs PaaS vs SaaS (IBM)', 'https://www.ibm.com/think/topics/iaas-paas-saas'),
      article('IaaS vs PaaS vs SaaS (Red Hat)', 'https://www.redhat.com/en/topics/cloud-computing/iaas-vs-paas-vs-saas'),
    ),
    'Public vs Private vs Hybrid cloud': topic(
      'Where workloads run: shared provider infrastructure, a dedicated private environment, or a mix of both.',
      article('What is hybrid cloud? (IBM)', 'https://www.ibm.com/think/topics/hybrid-cloud'),
      article('Hybrid cloud (Red Hat)', 'https://www.redhat.com/en/topics/cloud-computing/what-is-hybrid-cloud'),
    ),
    AWS: topic(
      'The largest cloud provider, with the widest range of services. A strong default to learn first.',
      docs('AWS getting started', 'https://aws.amazon.com/getting-started/'),
      course('AWS Skill Builder', 'https://skillbuilder.aws/'),
      docs('AWS documentation', 'https://docs.aws.amazon.com/'),
    ),
    'Google Cloud Platform': topic(
      "Google's cloud, known for data, analytics, Kubernetes and AI tooling.",
      docs('Google Cloud documentation', 'https://cloud.google.com/docs'),
      course('Google Cloud Skills Boost', 'https://www.cloudskillsboost.google/'),
    ),
    'Microsoft Azure': topic(
      "Microsoft's cloud, strong in enterprise, identity and hybrid setups.",
      docs('Azure documentation', 'https://learn.microsoft.com/en-us/azure/'),
      course('Microsoft Learn: Azure training', 'https://learn.microsoft.com/en-us/training/azure/'),
    ),
    'Virtual machines (EC2 / Compute Engine)': topic(
      'Rent a full server in minutes. You choose the OS and size, and you manage patches and scaling.',
      docs('Amazon EC2 docs', 'https://docs.aws.amazon.com/ec2/'),
      docs('Compute Engine docs', 'https://cloud.google.com/compute/docs'),
    ),
    'Containers (Docker, Kubernetes basics)': topic(
      'Containers package apps; Kubernetes schedules, scales and heals many containers across machines.',
      docs('Kubernetes basics tutorial', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/'),
      docs('Docker get started', 'https://docs.docker.com/get-started/'),
    ),
    'Serverless (Lambda / Cloud Functions)': topic(
      'Run code without managing servers; you pay per execution and the platform scales automatically.',
      docs('AWS Lambda docs', 'https://docs.aws.amazon.com/lambda/'),
      docs('Cloud Functions docs', 'https://cloud.google.com/functions/docs'),
    ),
    'Object storage (S3-style)': topic(
      'Store files and blobs cheaply and durably, addressed by bucket and key. Great for assets and backups.',
      docs('Amazon S3 user guide', 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html'),
      docs('Cloud Storage docs', 'https://cloud.google.com/storage/docs'),
    ),
    'Managed databases (RDS-style)': topic(
      'The provider handles backups, patching and failover for databases like Postgres and MySQL.',
      docs('Amazon RDS', 'https://aws.amazon.com/rds/'),
      docs('Cloud SQL docs', 'https://cloud.google.com/sql/docs'),
    ),
    'VPCs & Subnets': topic(
      'A private virtual network in the cloud, split into subnets with routing rules that decide what is public.',
      docs('What is Amazon VPC?', 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html'),
      docs('VPC overview (Google Cloud)', 'https://cloud.google.com/vpc/docs/overview'),
    ),
    'Load balancers': topic(
      'Spread incoming traffic across several servers and remove unhealthy ones for availability.',
      article('What is load balancing? (Cloudflare)', 'https://www.cloudflare.com/learning/performance/what-is-load-balancing/'),
      docs('Elastic Load Balancing docs', 'https://docs.aws.amazon.com/elasticloadbalancing/'),
    ),
    'DNS & CDN': topic(
      'Route users to your app by name, and cache content at edge locations close to them for lower latency.',
      article('What is a CDN? (Cloudflare)', 'https://www.cloudflare.com/learning/cdn/what-is-a-cdn/'),
      docs('Amazon Route 53', 'https://aws.amazon.com/route53/'),
    ),
    'Identity & Access Management': topic(
      'Control who can do what. Use least privilege, roles and short-lived credentials instead of shared keys.',
      docs('What is IAM? (AWS)', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html'),
      docs('IAM overview (Google Cloud)', 'https://cloud.google.com/iam/docs/overview'),
    ),
    'Security groups / firewalls': topic(
      'Virtual firewalls that allow only the traffic you expect to reach each resource.',
      docs('VPC security groups', 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html'),
      docs('VPC firewall rules (Google Cloud)', 'https://cloud.google.com/firewall/docs/firewalls'),
    ),
    'Cloud monitoring & logging': topic(
      'Collect metrics, logs and alerts so you notice and diagnose problems before users do.',
      docs('What is Amazon CloudWatch?', 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html'),
      docs('Prometheus overview', 'https://prometheus.io/docs/introduction/overview/'),
    ),
    'Cost optimization basics': topic(
      'Right-size resources, use budgets and alerts, and shut down what you are not using.',
      docs('AWS cost management', 'https://aws.amazon.com/aws-cost-management/'),
      article('What is FinOps?', 'https://www.finops.org/introduction/what-is-finops/'),
    ),
    'Terraform basics': topic(
      'Describe infrastructure in code so it can be reviewed, versioned and recreated reliably.',
      course('Terraform tutorials', 'https://developer.hashicorp.com/terraform/tutorials'),
      docs('Terraform documentation', 'https://developer.hashicorp.com/terraform/docs'),
    ),
    'CI/CD for cloud deployments': topic(
      'Automate testing and rollout of both application and infrastructure changes.',
      docs('GitHub Actions docs', 'https://docs.github.com/en/actions'),
      article('Continuous delivery (AWS)', 'https://aws.amazon.com/devops/continuous-delivery/'),
    ),
  },
}

const frontend: RoadmapContent = {
  tagline: 'Craft fast, accessible and beautiful interfaces.',
  description:
    'Go from HTML and CSS to modern JavaScript, TypeScript and React, then learn testing, performance, accessibility and shipping to production.',
  skills: ['HTML & CSS', 'JavaScript', 'TypeScript', 'React', 'State management', 'Tailwind CSS', 'Testing', 'Accessibility', 'Web performance', 'Vite'],
  languages: ['HTML', 'CSS', 'JavaScript', 'TypeScript'],
  frameworks: ['React', 'Next.js', 'Tailwind CSS', 'TanStack Query', 'Motion', 'React Router'],
  tools: ['Vite', 'Vitest', 'Playwright', 'Figma', 'Vercel', 'Git'],
  topics: {
    HTML: topic(
      'The structure of every web page. Use semantic elements so content is meaningful to browsers and assistive tech.',
      course('Learn HTML (web.dev)', 'https://web.dev/learn/html'),
      docs('HTML reference (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/HTML'),
    ),
    CSS: topic(
      'Style and lay out pages: the box model, Flexbox, Grid, custom properties and the cascade.',
      course('Learn CSS (web.dev)', 'https://web.dev/learn/css'),
      article('A complete guide to Flexbox', 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/'),
      article('A complete guide to Grid', 'https://css-tricks.com/snippets/css/complete-guide-grid/'),
    ),
    'Responsive design': topic(
      'Make layouts adapt from phones to desktops using fluid sizing, media queries and a mobile-first approach.',
      course('Learn Responsive Design', 'https://web.dev/learn/design'),
      docs('Responsive design (MDN)', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design'),
    ),
    'Browser DevTools': topic(
      'Inspect elements, debug JavaScript, throttle the network and profile performance right in the browser.',
      docs('Chrome DevTools', 'https://developer.chrome.com/docs/devtools'),
      docs('What are browser developer tools? (MDN)', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools'),
    ),
    'JavaScript fundamentals': topic(
      'Variables, functions, objects, arrays, closures and modern ES6+ syntax: the language of the web.',
      course('The Modern JavaScript Tutorial', 'https://javascript.info/'),
      docs('JavaScript Guide (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'),
    ),
    'DOM & events': topic(
      'The DOM is the live tree of a page. Select elements, change them and respond to user events.',
      docs('Intro to the DOM (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction'),
      course('Document (javascript.info)', 'https://javascript.info/document'),
    ),
    'Async JavaScript & fetch': topic(
      'Promises and async/await let you load data without freezing the page; fetch is the standard HTTP client.',
      course('Promises, async/await', 'https://javascript.info/async'),
      docs('Using the Fetch API (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch'),
    ),
    'ES modules': topic(
      'Split code into files with import and export so projects stay organised and tree-shakeable.',
      docs('JavaScript modules (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules'),
      course('Modules (javascript.info)', 'https://javascript.info/modules-intro'),
    ),
    'TypeScript basics': topic(
      'Add static types to JavaScript to catch bugs early and make large codebases easier to change.',
      docs('TypeScript handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html'),
      docs('TypeScript for JS programmers', 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html'),
    ),
    'Type narrowing & generics': topic(
      'Narrow union types safely and write reusable, type-safe functions and components with generics.',
      docs('Narrowing', 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html'),
      docs('Generics', 'https://www.typescriptlang.org/docs/handbook/2/generics.html'),
    ),
    'Components & props': topic(
      'Build UIs from small reusable components that receive data through props.',
      docs('React: Learn', 'https://react.dev/learn'),
      docs('Your first component', 'https://react.dev/learn/your-first-component'),
    ),
    'Hooks (useState, useEffect)': topic(
      'Hooks add state and side effects to function components. Learn when an effect is, and is not, needed.',
      docs('Built-in React hooks', 'https://react.dev/reference/react/hooks'),
      article('You might not need an effect', 'https://react.dev/learn/you-might-not-need-an-effect'),
    ),
    'Client-side routing': topic(
      'Navigate between pages without full reloads, with nested routes, params and protected routes.',
      docs('React Router', 'https://reactrouter.com/'),
      docs('React Router: tutorial', 'https://reactrouter.com/start/framework/installation'),
    ),
    'Forms & validation': topic(
      'Handle controlled inputs, validation and accessible error messages.',
      docs('React Hook Form', 'https://react-hook-form.com/get-started'),
      docs('Reacting to input with state', 'https://react.dev/learn/reacting-to-input-with-state'),
    ),
    'State management': topic(
      'Decide where state lives: local, lifted, context, or a store such as Zustand or Redux.',
      docs('Managing state (React)', 'https://react.dev/learn/managing-state'),
      docs('Zustand', 'https://zustand.docs.pmnd.rs/learn/getting-started/introduction'),
      docs('Redux Essentials', 'https://redux.js.org/tutorials/essentials/part-1-overview-concepts'),
    ),
    'Data fetching & caching': topic(
      'Manage server state with caching, retries and background refetching instead of hand-written effects.',
      docs('TanStack Query', 'https://tanstack.com/query/latest/docs/framework/react/overview'),
      docs('SWR', 'https://swr.vercel.app/'),
    ),
    'Tailwind CSS': topic(
      'A utility-first CSS framework: compose designs directly in your markup with consistent design tokens.',
      docs('Tailwind CSS docs', 'https://tailwindcss.com/docs'),
      docs('Utility-first fundamentals', 'https://tailwindcss.com/docs/styling-with-utility-classes'),
    ),
    'Animation (Motion)': topic(
      'Add purposeful motion: transitions, gestures and layout animations that guide attention without distracting.',
      docs('Motion for React', 'https://motion.dev/docs/react'),
      course('CSS animations (web.dev)', 'https://web.dev/learn/css/animations'),
    ),
    'Unit & component testing': topic(
      'Test components the way users use them, with fast tests that run on every change.',
      docs('Vitest guide', 'https://vitest.dev/guide/'),
      docs('React Testing Library', 'https://testing-library.com/docs/react-testing-library/intro/'),
    ),
    'End-to-end testing': topic(
      'Drive a real browser through key user flows such as sign-in and checkout.',
      docs('Playwright docs', 'https://playwright.dev/docs/intro'),
      docs('Cypress docs', 'https://docs.cypress.io/app/get-started/why-cypress'),
    ),
    'Core Web Vitals': topic(
      'Measure real-user loading, interactivity and visual stability (LCP, INP, CLS) and fix what is slow.',
      article('Web Vitals', 'https://web.dev/articles/vitals'),
      docs('Lighthouse overview', 'https://developer.chrome.com/docs/lighthouse/overview'),
    ),
    'Accessibility (a11y)': topic(
      'Build interfaces everyone can use: semantic HTML, keyboard support, focus states, contrast and ARIA when needed.',
      course('Learn Accessibility', 'https://web.dev/learn/accessibility'),
      docs('Accessibility (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/Accessibility'),
      article('WAI: accessibility fundamentals', 'https://www.w3.org/WAI/fundamentals/accessibility-intro/'),
    ),
    'Vite & bundlers': topic(
      'Tools that compile, bundle and serve your code with fast dev servers and optimised production builds.',
      docs('Vite guide', 'https://vite.dev/guide/'),
      docs('Why Vite', 'https://vite.dev/guide/why'),
    ),
    'Deploying a frontend': topic(
      'Ship static builds to a CDN with preview deployments and environment variables.',
      docs('Vercel docs', 'https://vercel.com/docs'),
      docs('Cloudflare Pages', 'https://developers.cloudflare.com/pages/'),
      docs('Netlify docs', 'https://docs.netlify.com/'),
    ),
  },
}

const ai: RoadmapContent = {
  tagline: 'Build products powered by machine learning and LLMs.',
  description:
    'Start with Python and core ML, understand neural networks and transformers, then build LLM apps with RAG, agents, evaluation and production monitoring.',
  skills: ['Python', 'Math for ML', 'scikit-learn', 'PyTorch', 'Transformers', 'Prompt engineering', 'RAG & embeddings', 'Agents & tools', 'Evaluation', 'LLM ops'],
  languages: ['Python', 'SQL'],
  frameworks: ['PyTorch', 'scikit-learn', 'Hugging Face', 'LangChain', 'LlamaIndex', 'pandas', 'NumPy'],
  tools: ['Jupyter', 'pgvector', 'Qdrant', 'Langfuse', 'Docker', 'Weights & Biases'],
  topics: {
    'Python for AI': topic(
      'The default language of AI. Get comfortable with functions, classes, virtual environments and notebooks.',
      docs('The Python Tutorial', 'https://docs.python.org/3/tutorial/'),
      course('Kaggle: Python', 'https://www.kaggle.com/learn/python'),
    ),
    'Math: linear algebra & probability': topic(
      'Vectors, matrices, gradients and probability are the language models are described in.',
      video('Essence of linear algebra (3Blue1Brown)', 'https://www.3blue1brown.com/topics/linear-algebra'),
      course('Khan Academy: Linear algebra', 'https://www.khanacademy.org/math/linear-algebra'),
      course('Khan Academy: Statistics & probability', 'https://www.khanacademy.org/math/statistics-probability'),
    ),
    'NumPy & pandas': topic(
      'Manipulate arrays and tabular data efficiently: the workhorses of data preparation.',
      docs('NumPy: absolute beginners', 'https://numpy.org/doc/stable/user/absolute_beginners.html'),
      docs('10 minutes to pandas', 'https://pandas.pydata.org/docs/user_guide/10min.html'),
      course('Kaggle: Pandas', 'https://www.kaggle.com/learn/pandas'),
    ),
    'Machine learning concepts': topic(
      'Supervised vs unsupervised learning, features, overfitting and the train/validation/test split.',
      course('Machine Learning Crash Course (Google)', 'https://developers.google.com/machine-learning/crash-course'),
      course('Machine Learning Specialization', 'https://www.coursera.org/specializations/machine-learning-introduction'),
    ),
    'scikit-learn': topic(
      'A friendly library for classical ML: regression, classification, clustering and pipelines.',
      docs('scikit-learn: getting started', 'https://scikit-learn.org/stable/getting_started.html'),
      docs('scikit-learn user guide', 'https://scikit-learn.org/stable/user_guide.html'),
    ),
    'Model evaluation': topic(
      'Measure models honestly with the right metrics (accuracy, precision, recall, F1) and cross-validation.',
      docs('scikit-learn: model evaluation', 'https://scikit-learn.org/stable/modules/model_evaluation.html'),
      course('Classification metrics (Google)', 'https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall'),
    ),
    'Neural networks': topic(
      'Layers of weighted connections trained by backpropagation and gradient descent.',
      video('Neural networks (3Blue1Brown)', 'https://www.3blue1brown.com/topics/neural-networks'),
      book('Neural Networks and Deep Learning', 'http://neuralnetworksanddeeplearning.com/'),
    ),
    PyTorch: topic(
      'The leading deep learning framework: tensors, autograd and training loops.',
      course('PyTorch: learn the basics', 'https://pytorch.org/tutorials/beginner/basics/intro.html'),
      docs('PyTorch documentation', 'https://pytorch.org/docs/stable/index.html'),
    ),
    'Transformers & attention': topic(
      'The architecture behind modern LLMs: self-attention lets a model weigh every token against every other.',
      article('The Illustrated Transformer', 'https://jalammar.github.io/illustrated-transformer/'),
      course('Hugging Face LLM course', 'https://huggingface.co/learn/llm-course'),
      article('Attention Is All You Need', 'https://arxiv.org/abs/1706.03762'),
    ),
    'Prompt engineering': topic(
      'Write clear instructions, examples and constraints so a model behaves reliably.',
      docs('Prompt engineering overview (Anthropic)', 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview'),
      article('Prompt Engineering Guide', 'https://www.promptingguide.ai/'),
    ),
    'Working with LLM APIs': topic(
      'Call hosted models with messages, system prompts, streaming and sensible token and cost limits.',
      docs('Anthropic API getting started', 'https://docs.anthropic.com/en/api/getting-started'),
      docs('OpenAI API docs', 'https://platform.openai.com/docs'),
    ),
    'Structured outputs & tool use': topic(
      'Make models return JSON and call your functions so their output can drive real software.',
      docs('Tool use (Anthropic)', 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview'),
      docs('Function calling (OpenAI)', 'https://platform.openai.com/docs/guides/function-calling'),
    ),
    Embeddings: topic(
      'Turn text into vectors so similar meanings sit close together, enabling semantic search.',
      article('Getting started with embeddings', 'https://huggingface.co/blog/getting-started-with-embeddings'),
      docs('Embeddings guide (OpenAI)', 'https://platform.openai.com/docs/guides/embeddings'),
    ),
    'Vector databases': topic(
      'Store and search embeddings quickly with approximate nearest-neighbour indexes.',
      article('What is a vector database? (Pinecone)', 'https://www.pinecone.io/learn/vector-database/'),
      docs('pgvector', 'https://github.com/pgvector/pgvector'),
      docs('Qdrant docs', 'https://qdrant.tech/documentation/'),
    ),
    'RAG pipelines': topic(
      'Retrieve relevant documents and put them in the prompt so answers are grounded in your own data.',
      article('Retrieval-augmented generation (Pinecone)', 'https://www.pinecone.io/learn/retrieval-augmented-generation/'),
      docs('Build a RAG app (LangChain)', 'https://python.langchain.com/docs/tutorials/rag/'),
      article('RAG paper', 'https://arxiv.org/abs/2005.11401'),
    ),
    'Agent patterns': topic(
      'Let a model plan, call tools and loop until a task is done, and know when a simple workflow is enough.',
      article('Building effective agents (Anthropic)', 'https://www.anthropic.com/engineering/building-effective-agents'),
      article('LLM-powered autonomous agents', 'https://lilianweng.github.io/posts/2023-06-23-agent/'),
    ),
    'Model Context Protocol (MCP)': topic(
      'An open standard for connecting AI apps to tools and data sources through reusable servers.',
      docs('MCP introduction', 'https://modelcontextprotocol.io/introduction'),
      docs('MCP documentation', 'https://modelcontextprotocol.io/docs/getting-started/intro'),
    ),
    'Evals & testing LLM apps': topic(
      'Build a test set and graders so you can tell whether a prompt or model change really improved things.',
      article('Your product needs evals', 'https://hamel.dev/blog/posts/evals/'),
      docs('Develop tests (Anthropic)', 'https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests'),
    ),
    'Safety & guardrails': topic(
      'Defend against prompt injection, data leaks and harmful output with validation and least-privilege tools.',
      docs('OWASP Top 10 for LLM apps', 'https://owasp.org/www-project-top-10-for-large-language-model-applications/'),
      docs('NIST AI Risk Management Framework', 'https://www.nist.gov/itl/ai-risk-management-framework'),
    ),
    'Serving & cost optimization': topic(
      'Keep latency and spend in check with caching, batching, smaller models and efficient inference servers.',
      docs('vLLM docs', 'https://docs.vllm.ai/'),
      docs('Prompt caching (Anthropic)', 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching'),
    ),
    'Observability for LLM apps': topic(
      'Trace every call, log prompts and responses, and track quality, latency and cost in production.',
      docs('OpenTelemetry docs', 'https://opentelemetry.io/docs/'),
      docs('Langfuse docs', 'https://langfuse.com/docs'),
    ),
  },
}

const fullstack: RoadmapContent = {
  tagline: 'Ship complete products, from database to user interface.',
  description:
    'Learn the whole web stack: build a React front end, a Node.js API and a PostgreSQL database, connect them, test them and deploy the result.',
  skills: ['HTTP & REST', 'Component architecture', 'API design', 'SQL modeling', 'Authentication', 'Real-time apps', 'Testing', 'Docker', 'CI/CD', 'Deployment'],
  languages: ['JavaScript', 'TypeScript', 'SQL', 'HTML', 'CSS'],
  frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'Prisma', 'GraphQL', 'Tailwind CSS'],
  tools: ['PostgreSQL', 'MongoDB', 'Docker', 'Git', 'GitHub Actions', 'Vercel'],
  topics: {
    'HTML & CSS essentials': topic(
      'Structure pages with semantic HTML and lay them out responsively with Flexbox and Grid.',
      course('Learn HTML', 'https://web.dev/learn/html'),
      course('Learn CSS', 'https://web.dev/learn/css'),
    ),
    'JavaScript & TypeScript': topic(
      'Master the language of the web, then add types so large codebases stay safe to change.',
      course('The Modern JavaScript Tutorial', 'https://javascript.info/'),
      docs('TypeScript handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html'),
    ),
    'React & component architecture': topic(
      'Build UIs from small reusable components and decide where state should live.',
      docs('React: Learn', 'https://react.dev/learn'),
      article('Thinking in React', 'https://react.dev/learn/thinking-in-react'),
    ),
    'Next.js (full-stack React)': topic(
      'A React framework with routing, server rendering and API routes in one project.',
      course('Learn Next.js', 'https://nextjs.org/learn'),
      docs('Next.js documentation', 'https://nextjs.org/docs'),
    ),
    'Node.js & Express': topic(
      'Run JavaScript on the server and build HTTP routes and middleware with Express.',
      docs('Introduction to Node.js', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs'),
      docs('Express: getting started', 'https://expressjs.com/en/starter/installing.html'),
    ),
    'REST & GraphQL APIs': topic(
      'Expose data through resource-based REST endpoints or a typed GraphQL schema, and know when to pick each.',
      course('Introduction to GraphQL', 'https://graphql.org/learn/'),
      article('REST API tutorial', 'https://restfulapi.net/'),
    ),
    'Authentication & sessions': topic(
      'Hash passwords, issue sessions or tokens, and protect routes against common attacks.',
      docs('OWASP Authentication cheat sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'),
      docs('Introduction to JWT', 'https://jwt.io/introduction'),
    ),
    'SQL & PostgreSQL': topic(
      'Model data in tables, join them and keep it consistent with constraints and transactions.',
      docs('PostgreSQL tutorial', 'https://www.postgresql.org/docs/current/tutorial.html'),
      practice('SQLBolt', 'https://sqlbolt.com/'),
    ),
    'ORMs with Prisma': topic(
      'Define a schema once and get type-safe database queries and migrations.',
      docs('Prisma: getting started', 'https://www.prisma.io/docs/getting-started'),
      docs('Prisma concepts', 'https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma'),
    ),
    'MongoDB basics': topic(
      'Store flexible JSON-like documents and learn when a document database fits.',
      course('MongoDB University', 'https://learn.mongodb.com/'),
      docs('MongoDB getting started', 'https://www.mongodb.com/docs/manual/tutorial/getting-started/'),
    ),
    'Calling APIs from the front end': topic(
      'Fetch data, handle loading and error states, and cache server state on the client.',
      docs('Using the Fetch API', 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch'),
      docs('TanStack Query', 'https://tanstack.com/query/latest/docs/framework/react/overview'),
    ),
    'Real-time with WebSockets': topic(
      'Push updates to the browser instantly for chat, notifications and live dashboards.',
      docs('WebSockets API (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API'),
      docs('Socket.IO docs', 'https://socket.io/docs/v4/'),
    ),
    'Testing full-stack apps': topic(
      'Cover units, API calls and whole user flows so you can refactor with confidence.',
      docs('Vitest guide', 'https://vitest.dev/guide/'),
      docs('Playwright docs', 'https://playwright.dev/docs/intro'),
    ),
    'Docker for full-stack apps': topic(
      'Package the front end, API and database so they run the same on every machine.',
      docs('Docker get started', 'https://docs.docker.com/get-started/'),
      docs('Docker Compose', 'https://docs.docker.com/compose/'),
    ),
    'CI/CD & deployment': topic(
      'Automate tests and releases, then host the app with preview environments.',
      docs('GitHub Actions docs', 'https://docs.github.com/en/actions'),
      docs('Vercel docs', 'https://vercel.com/docs'),
      docs('Render docs', 'https://render.com/docs'),
    ),
  },
}

const devops: RoadmapContent = {
  tagline: 'Automate how software is built, shipped and kept running.',
  description:
    'Learn Linux, containers, infrastructure as code, CI/CD and observability so teams can release quickly without breaking production.',
  skills: ['Linux administration', 'Scripting', 'CI/CD pipelines', 'Containers', 'Kubernetes', 'Infrastructure as code', 'Monitoring', 'Incident response', 'Security', 'GitOps'],
  languages: ['Bash', 'Python', 'Go', 'YAML', 'HCL'],
  frameworks: ['Terraform', 'Kubernetes', 'Ansible', 'Helm', 'Argo CD', 'GitHub Actions'],
  tools: ['Linux', 'Docker', 'AWS', 'Prometheus', 'Grafana', 'Loki'],
  topics: {
    'Linux fundamentals': topic(
      'Work confidently in the shell: files, permissions, processes, services and package managers.',
      course('Linux Journey', 'https://linuxjourney.com/'),
      course('Command line for beginners (Ubuntu)', 'https://ubuntu.com/tutorials/command-line-for-beginners'),
    ),
    'Shell scripting (Bash)': topic(
      'Automate repetitive work with scripts, pipes and exit codes.',
      docs('Bash reference manual', 'https://www.gnu.org/software/bash/manual/bash.html'),
      practice('explainshell', 'https://explainshell.com/'),
    ),
    'Networking basics': topic(
      'Understand IPs, ports, DNS, HTTP and TLS well enough to debug connectivity.',
      docs('An overview of HTTP (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview'),
      article('What is DNS? (Cloudflare)', 'https://www.cloudflare.com/learning/dns/what-is-dns/'),
    ),
    'Git branching strategies': topic(
      'Choose between trunk-based development, GitHub flow and Git flow for your team.',
      article('Comparing Git workflows (Atlassian)', 'https://www.atlassian.com/git/tutorials/comparing-workflows'),
      article('Trunk Based Development', 'https://trunkbaseddevelopment.com/'),
    ),
    'CI pipelines (GitHub Actions)': topic(
      'Build, test and lint on every push, and cache work to keep pipelines fast.',
      docs('GitHub Actions quickstart', 'https://docs.github.com/en/actions/writing-workflows/quickstart'),
      docs('GitHub Actions docs', 'https://docs.github.com/en/actions'),
    ),
    'Docker': topic(
      'Build small, secure images and run them consistently from laptop to production.',
      docs('Docker get started', 'https://docs.docker.com/get-started/'),
      docs('Build best practices', 'https://docs.docker.com/build/building/best-practices/'),
    ),
    'Kubernetes': topic(
      'Schedule, scale and heal containers across a cluster with deployments, services and probes.',
      docs('Kubernetes basics tutorial', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/'),
      docs('Kubernetes concepts', 'https://kubernetes.io/docs/concepts/overview/'),
    ),
    'Terraform': topic(
      'Declare cloud resources in code, review the plan, and apply changes repeatably.',
      course('Terraform tutorials', 'https://developer.hashicorp.com/terraform/tutorials'),
      docs('Terraform documentation', 'https://developer.hashicorp.com/terraform/docs'),
    ),
    'Ansible': topic(
      'Configure servers with idempotent playbooks instead of manual steps.',
      docs('Ansible getting started', 'https://docs.ansible.com/ansible/latest/getting_started/index.html'),
      docs('Ansible user guide', 'https://docs.ansible.com/ansible/latest/user_guide/index.html'),
    ),
    'AWS fundamentals for DevOps': topic(
      'Core services you will automate: EC2, VPC, IAM, S3 and load balancers.',
      docs('AWS getting started', 'https://aws.amazon.com/getting-started/'),
      docs('AWS documentation', 'https://docs.aws.amazon.com/'),
    ),
    'Metrics with Prometheus & Grafana': topic(
      'Collect time-series metrics, build dashboards and alert on what matters.',
      docs('Prometheus overview', 'https://prometheus.io/docs/introduction/overview/'),
      docs('Grafana getting started', 'https://grafana.com/docs/grafana/latest/getting-started/'),
    ),
    'Centralized logging': topic(
      'Ship logs from every service to one searchable place for debugging.',
      docs('Grafana Loki docs', 'https://grafana.com/docs/loki/latest/'),
      docs('What is Elasticsearch?', 'https://www.elastic.co/guide/en/elasticsearch/reference/current/elasticsearch-intro.html'),
    ),
    'SRE principles & SLOs': topic(
      'Define reliability targets, error budgets and blameless postmortems.',
      book('Site Reliability Engineering book', 'https://sre.google/sre-book/table-of-contents/'),
      book('The SRE Workbook', 'https://sre.google/workbook/table-of-contents/'),
    ),
    'DevSecOps basics': topic(
      'Scan code, images and dependencies in the pipeline and manage secrets safely.',
      docs('OWASP DevSecOps guideline', 'https://owasp.org/www-project-devsecops-guideline/'),
      docs('OWASP cheat sheets', 'https://cheatsheetseries.owasp.org/'),
    ),
    'GitOps with Argo CD': topic(
      'Keep Git as the source of truth and let a controller sync it to your cluster.',
      docs('Argo CD documentation', 'https://argo-cd.readthedocs.io/en/stable/'),
      docs('OpenGitOps principles', 'https://opengitops.dev/'),
    ),
  },
}

const datasci: RoadmapContent = {
  tagline: 'Turn raw data into insight, models and decisions.',
  description:
    'Learn Python, statistics and SQL, then clean and explore data, build machine learning models, and communicate the results clearly.',
  skills: ['Statistics', 'Data wrangling', 'Exploratory analysis', 'Data visualization', 'Feature engineering', 'Supervised learning', 'Model validation', 'Time series', 'NLP', 'Experiment tracking'],
  languages: ['Python', 'SQL', 'R'],
  frameworks: ['pandas', 'NumPy', 'scikit-learn', 'Matplotlib', 'seaborn', 'statsmodels', 'Hugging Face'],
  tools: ['Jupyter', 'MLflow', 'Kaggle', 'Git', 'Tableau', 'Docker'],
  topics: {
    'Python for data science': topic(
      'Write clear Python with functions, comprehensions and virtual environments.',
      docs('The Python Tutorial', 'https://docs.python.org/3/tutorial/'),
      course('Kaggle: Python', 'https://www.kaggle.com/learn/python'),
    ),
    'Statistics & probability': topic(
      'Distributions, hypothesis tests and confidence intervals are the basis of every conclusion you draw.',
      course('Khan Academy: Statistics & probability', 'https://www.khanacademy.org/math/statistics-probability'),
      practice('Seeing Theory', 'https://seeing-theory.brown.edu/'),
    ),
    'SQL for analysis': topic(
      'Query, join and aggregate data where it lives, including window functions.',
      course('Mode SQL tutorial', 'https://mode.com/sql-tutorial'),
      course('Kaggle: Intro to SQL', 'https://www.kaggle.com/learn/intro-to-sql'),
    ),
    'pandas': topic(
      'Load, reshape, merge and group tabular data with DataFrames.',
      docs('10 minutes to pandas', 'https://pandas.pydata.org/docs/user_guide/10min.html'),
      course('Kaggle: Pandas', 'https://www.kaggle.com/learn/pandas'),
    ),
    'Data cleaning': topic(
      'Handle missing values, duplicates, outliers and inconsistent formats before analysis.',
      course('Kaggle: Data cleaning', 'https://www.kaggle.com/learn/data-cleaning'),
      docs('pandas: working with missing data', 'https://pandas.pydata.org/docs/user_guide/missing_data.html'),
    ),
    'Exploratory data analysis': topic(
      'Summarise and plot data to find patterns, problems and good questions.',
      docs('seaborn tutorial', 'https://seaborn.pydata.org/tutorial.html'),
      course('Kaggle: Data visualization', 'https://www.kaggle.com/learn/data-visualization'),
    ),
    'Matplotlib & seaborn': topic(
      'Create clear static charts and customise them for presentations.',
      docs('Matplotlib tutorials', 'https://matplotlib.org/stable/tutorials/index.html'),
      docs('seaborn documentation', 'https://seaborn.pydata.org/'),
    ),
    'Storytelling with data': topic(
      'Choose the right chart and guide the audience to the point you want to make.',
      book('Fundamentals of Data Visualization', 'https://clauswilke.com/dataviz/'),
      article('Storytelling with Data blog', 'https://www.storytellingwithdata.com/blog'),
    ),
    'Supervised learning': topic(
      'Train regression and classification models from labelled examples.',
      docs('scikit-learn: supervised learning', 'https://scikit-learn.org/stable/supervised_learning.html'),
      course('Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course'),
    ),
    'Unsupervised learning': topic(
      'Find structure without labels using clustering and dimensionality reduction.',
      docs('scikit-learn: unsupervised learning', 'https://scikit-learn.org/stable/unsupervised_learning.html'),
      docs('scikit-learn: clustering', 'https://scikit-learn.org/stable/modules/clustering.html'),
    ),
    'Feature engineering': topic(
      'Create and transform inputs so models can learn from them more easily.',
      course('Kaggle: Feature engineering', 'https://www.kaggle.com/learn/feature-engineering'),
      docs('scikit-learn: preprocessing', 'https://scikit-learn.org/stable/modules/preprocessing.html'),
    ),
    'Model evaluation & validation': topic(
      'Use cross-validation and the right metrics to avoid fooling yourself with overfit models.',
      docs('scikit-learn: cross-validation', 'https://scikit-learn.org/stable/modules/cross_validation.html'),
      docs('scikit-learn: model evaluation', 'https://scikit-learn.org/stable/modules/model_evaluation.html'),
    ),
    'Time series basics': topic(
      'Model trends and seasonality and forecast values over time.',
      book('Forecasting: Principles and Practice', 'https://otexts.com/fpp3/'),
      course('Kaggle: Time series', 'https://www.kaggle.com/learn/time-series'),
    ),
    'Natural language processing': topic(
      'Turn text into features and models for classification, search and summarisation.',
      course('Hugging Face LLM course', 'https://huggingface.co/learn/llm-course'),
      book('Natural Language Processing with Python (NLTK)', 'https://www.nltk.org/book/'),
    ),
    'Notebooks & reproducible analysis': topic(
      'Make analyses that others, and future you, can rerun and trust.',
      docs('Project Jupyter documentation', 'https://jupyter.org/documentation'),
      book('The Turing Way: reproducible research', 'https://book.the-turing-way.org/reproducible-research/reproducible-research'),
    ),
    'Experiment tracking & MLOps': topic(
      'Log parameters, metrics and models so results can be compared and reproduced.',
      docs('MLflow documentation', 'https://mlflow.org/docs/latest/index.html'),
      article('MLOps principles', 'https://ml-ops.org/'),
    ),
  },
}

const mobile: RoadmapContent = {
  tagline: 'Build apps people carry in their pocket, on iOS and Android.',
  description:
    'Learn mobile UX and architecture, then build with React Native or Flutter, or go native with Swift and Kotlin, and ship to both app stores.',
  skills: ['Mobile UX', 'Cross-platform development', 'Native development', 'App architecture', 'State management', 'Offline storage', 'Networking', 'Testing', 'Performance', 'App store release'],
  languages: ['Swift', 'Kotlin', 'Dart', 'TypeScript', 'JavaScript'],
  frameworks: ['React Native', 'Expo', 'Flutter', 'SwiftUI', 'Jetpack Compose', 'Retrofit'],
  tools: ['Xcode', 'Android Studio', 'Firebase', 'Git', 'Fastlane', 'TestFlight'],
  topics: {
    'Mobile app fundamentals': topic(
      'App lifecycle, screens, navigation and permissions: concepts shared by every platform.',
      course('Android basics with Compose', 'https://developer.android.com/courses/android-basics-compose/course'),
      course('Develop in Swift tutorials', 'https://developer.apple.com/tutorials/app-dev-training'),
    ),
    'Mobile UI & UX design': topic(
      'Design for thumbs, small screens and platform conventions.',
      docs('Apple Human Interface Guidelines', 'https://developer.apple.com/design/human-interface-guidelines/'),
      docs('Material Design 3', 'https://m3.material.io/'),
    ),
    'React Native': topic(
      'Build native iOS and Android apps with React and JavaScript or TypeScript.',
      docs('React Native docs', 'https://reactnative.dev/docs/getting-started'),
      course('Expo tutorial', 'https://docs.expo.dev/tutorial/introduction/'),
    ),
    'Flutter & Dart': topic(
      'One codebase and a rich widget toolkit, drawn by Flutter itself on every platform.',
      course('Flutter codelab', 'https://docs.flutter.dev/get-started/codelab'),
      docs('Dart language tour', 'https://dart.dev/language'),
    ),
    'Swift': topic(
      'A modern, safe language for Apple platforms with optionals, structs and concurrency.',
      book('The Swift Programming Language', 'https://docs.swift.org/swift-book/'),
      docs('Getting started with Swift', 'https://www.swift.org/getting-started/'),
    ),
    'SwiftUI': topic(
      'Describe iOS interfaces declaratively and let the framework update them as state changes.',
      course('SwiftUI tutorials', 'https://developer.apple.com/tutorials/swiftui'),
      docs('SwiftUI documentation', 'https://developer.apple.com/documentation/swiftui'),
    ),
    'Kotlin': topic(
      'The preferred Android language: concise, null-safe, with coroutines for async work.',
      docs('Kotlin getting started', 'https://kotlinlang.org/docs/getting-started.html'),
      practice('Kotlin Koans', 'https://play.kotlinlang.org/koans/overview'),
    ),
    'Jetpack Compose': topic(
      'Android modern declarative UI toolkit.',
      docs('Jetpack Compose', 'https://developer.android.com/compose'),
      course('Jetpack Compose course', 'https://developer.android.com/courses/jetpack-compose/course'),
    ),
    'App architecture & state': topic(
      'Separate UI, state and data with patterns like MVVM so apps stay testable.',
      docs('Android app architecture', 'https://developer.android.com/topic/architecture'),
      docs('Flutter app architecture', 'https://docs.flutter.dev/app-architecture'),
    ),
    'Networking & local storage': topic(
      'Call APIs, cache responses and make the app usable offline.',
      docs('Android data storage', 'https://developer.android.com/training/data-storage'),
      docs('Retrofit', 'https://github.com/square/retrofit'),
      docs('URLSession (Apple)', 'https://developer.apple.com/documentation/foundation/urlsession'),
    ),
    'Testing mobile apps': topic(
      'Unit, UI and device tests that catch regressions before users do.',
      docs('Android testing', 'https://developer.android.com/training/testing'),
      docs('XCTest (Apple)', 'https://developer.apple.com/documentation/xctest'),
    ),
    'Performance & debugging': topic(
      'Keep scrolling smooth and startup fast, and find memory and battery problems.',
      docs('React Native performance', 'https://reactnative.dev/docs/performance'),
      docs('Android performance', 'https://developer.android.com/topic/performance'),
    ),
    'Publishing to the App Store & Google Play': topic(
      'Sign, build, test with beta users and pass store review.',
      docs('Submit to the App Store', 'https://developer.apple.com/app-store/submitting/'),
      docs('Publish your app (Android)', 'https://developer.android.com/studio/publish'),
    ),
    'Push notifications & analytics': topic(
      'Re-engage users and measure what they actually do in the app.',
      docs('Firebase Cloud Messaging', 'https://firebase.google.com/docs/cloud-messaging'),
      docs('Google Analytics for Firebase', 'https://firebase.google.com/docs/analytics'),
    ),
  },
}

export const ROADMAP_CONTENT: Record<string, RoadmapContent> = {
  'backend-software-engineer': backend,
  'cloud-computing': cloud,
  'frontend-software-engineer': frontend,
  'ai-engineer': ai,
  'full-stack-engineer': fullstack,
  'devops-engineer': devops,
  'data-scientist': datasci,
  'mobile-engineer': mobile,
}

export function getRoadmapStats(slug: string) {
  const content = ROADMAP_CONTENT[slug]
  if (!content) return { resources: 0, skills: 0, topics: 0 }
  const topics = Object.values(content.topics)
  return {
    resources: topics.reduce((sum, t) => sum + t.resources.length, 0),
    skills: content.skills.length,
    topics: topics.length,
  }
}
