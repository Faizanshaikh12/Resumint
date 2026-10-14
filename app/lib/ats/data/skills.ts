export interface SkillDefinition {
  canonical: string;
  category:
    | "languages"
    | "frontend"
    | "backend"
    | "cloud_devops"
    | "databases"
    | "testing"
    | "data_ai"
    | "product_design"
    | "practices"
    | "business_marketing"
    | "healthcare_nursing";
  aliases?: string[];
}

export const SKILLS_CATALOG: SkillDefinition[] = [
  // Programming Languages
  { canonical: "TypeScript", category: "languages", aliases: ["ts"] },
  { canonical: "JavaScript", category: "languages", aliases: ["js", "es6", "vanilla js"] },
  { canonical: "Python", category: "languages", aliases: ["py", "python3", "python 3"] },
  { canonical: "Go", category: "languages", aliases: ["golang"] },
  { canonical: "Rust", category: "languages" },
  { canonical: "C++", category: "languages", aliases: ["cpp"] },
  { canonical: "C#", category: "languages", aliases: ["csharp"] },
  { canonical: "Java", category: "languages" },
  { canonical: "Kotlin", category: "languages" },
  { canonical: "Swift", category: "languages" },
  { canonical: "Ruby", category: "languages" },
  { canonical: "PHP", category: "languages" },
  { canonical: "SQL", category: "languages" },
  { canonical: "R", category: "languages" },
  { canonical: "Scala", category: "languages" },
  { canonical: "Shell", category: "languages", aliases: ["bash", "zsh", "sh"] },
  { canonical: "HTML", category: "languages", aliases: ["html5"] },
  { canonical: "CSS", category: "languages", aliases: ["css3"] },

  // Frontend Frameworks & Libraries
  { canonical: "React", category: "frontend", aliases: ["reactjs", "react.js"] },
  { canonical: "Next.js", category: "frontend", aliases: ["nextjs", "next"] },
  { canonical: "Vue.js", category: "frontend", aliases: ["vue", "vuejs"] },
  { canonical: "Angular", category: "frontend", aliases: ["angularjs", "angular 2+"] },
  { canonical: "Svelte", category: "frontend", aliases: ["sveltekit"] },
  { canonical: "React Router", category: "frontend", aliases: ["react-router", "react router v7"] },
  { canonical: "Tailwind CSS", category: "frontend", aliases: ["tailwind", "tailwindcss"] },
  { canonical: "Redux", category: "frontend", aliases: ["redux toolkit", "rtk"] },
  { canonical: "GraphQL", category: "frontend", aliases: ["apollo", "apollo client"] },
  { canonical: "Webpack", category: "frontend" },
  { canonical: "Vite", category: "frontend" },
  { canonical: "WebSockets", category: "frontend", aliases: ["websocket", "socket.io"] },

  // Backend Frameworks & Systems
  { canonical: "Node.js", category: "backend", aliases: ["node", "nodejs"] },
  { canonical: "Express", category: "backend", aliases: ["express.js", "expressjs"] },
  { canonical: "NestJS", category: "backend", aliases: ["nest.js", "nest"] },
  { canonical: "FastAPI", category: "backend" },
  { canonical: "Django", category: "backend", aliases: ["django rest framework", "drf"] },
  { canonical: "Flask", category: "backend" },
  { canonical: "Spring Boot", category: "backend", aliases: ["spring", "java spring"] },
  { canonical: "Ruby on Rails", category: "backend", aliases: ["rails"] },
  { canonical: ".NET", category: "backend", aliases: ["dotnet", "asp.net", "asp.net core", ".net core"] },
  { canonical: "REST APIs", category: "backend", aliases: ["restful api", "rest", "rest api", "api design"] },
  { canonical: "gRPC", category: "backend", aliases: ["protobuf", "protocol buffers"] },
  { canonical: "Microservices", category: "backend", aliases: ["microservice architecture"] },

  // Cloud & DevOps
  { canonical: "AWS", category: "cloud_devops", aliases: ["amazon web services", "aws cloud", "ec2", "s3", "lambda"] },
  { canonical: "Google Cloud", category: "cloud_devops", aliases: ["gcp", "google cloud platform"] },
  { canonical: "Azure", category: "cloud_devops", aliases: ["microsoft azure"] },
  { canonical: "Cloudflare", category: "cloud_devops", aliases: ["cloudflare workers", "wrangler", "d1"] },
  { canonical: "Docker", category: "cloud_devops", aliases: ["containerization", "containers"] },
  { canonical: "Kubernetes", category: "cloud_devops", aliases: ["k8s", "k8"] },
  { canonical: "Terraform", category: "cloud_devops", aliases: ["tf", "iac", "infrastructure as code"] },
  { canonical: "CI/CD", category: "cloud_devops", aliases: ["ci cd", "cicd", "continuous integration", "continuous deployment"] },
  { canonical: "GitHub Actions", category: "cloud_devops", aliases: ["gh actions"] },
  { canonical: "GitLab CI", category: "cloud_devops" },
  { canonical: "Jenkins", category: "cloud_devops" },
  { canonical: "Linux", category: "cloud_devops", aliases: ["unix", "ubuntu", "debian"] },
  { canonical: "Kafka", category: "cloud_devops", aliases: ["apache kafka"] },
  { canonical: "RabbitMQ", category: "cloud_devops", aliases: ["message queues", "amqp"] },
  { canonical: "Prometheus", category: "cloud_devops" },
  { canonical: "Grafana", category: "cloud_devops" },
  { canonical: "Datadog", category: "cloud_devops" },

  // Databases & Storage
  { canonical: "PostgreSQL", category: "databases", aliases: ["postgres", "pgsql"] },
  { canonical: "MySQL", category: "databases", aliases: ["mariadb"] },
  { canonical: "SQLite", category: "databases", aliases: ["sqlite3"] },
  { canonical: "MongoDB", category: "databases", aliases: ["mongo"] },
  { canonical: "Redis", category: "databases" },
  { canonical: "Elasticsearch", category: "databases", aliases: ["elastic", "elk"] },
  { canonical: "DynamoDB", category: "databases" },
  { canonical: "Drizzle ORM", category: "databases", aliases: ["drizzle"] },
  { canonical: "Prisma", category: "databases", aliases: ["prisma orm"] },
  { canonical: "Cassandra", category: "databases" },
  { canonical: "Snowflake", category: "databases" },
  { canonical: "BigQuery", category: "databases" },

  // Testing & Quality Assurance
  { canonical: "Vitest", category: "testing" },
  { canonical: "Jest", category: "testing" },
  { canonical: "Playwright", category: "testing" },
  { canonical: "Cypress", category: "testing" },
  { canonical: "Selenium", category: "testing" },
  { canonical: "TDD", category: "testing", aliases: ["test-driven development", "test driven development"] },
  { canonical: "Unit Testing", category: "testing", aliases: ["unit tests"] },
  { canonical: "E2E Testing", category: "testing", aliases: ["end-to-end testing", "e2e tests"] },

  // Data Science & AI
  { canonical: "Machine Learning", category: "data_ai", aliases: ["ml"] },
  { canonical: "Artificial Intelligence", category: "data_ai", aliases: ["ai"] },
  { canonical: "Deep Learning", category: "data_ai", aliases: ["dl"] },
  { canonical: "Natural Language Processing", category: "data_ai", aliases: ["nlp"] },
  { canonical: "PyTorch", category: "data_ai" },
  { canonical: "TensorFlow", category: "data_ai", aliases: ["tf"] },
  { canonical: "Pandas", category: "data_ai" },
  { canonical: "NumPy", category: "data_ai" },
  { canonical: "Scikit-Learn", category: "data_ai", aliases: ["sklearn"] },
  { canonical: "Data Pipelines", category: "data_ai", aliases: ["etl", "elt", "data ingestion"] },
  { canonical: "Computer Vision", category: "data_ai", aliases: ["cv", "opencv"] },

  // Product, Design & Architecture
  { canonical: "Figma", category: "product_design" },
  { canonical: "UI/UX Design", category: "product_design", aliases: ["ui design", "ux design", "product design"] },
  { canonical: "Wireframing", category: "product_design", aliases: ["prototyping"] },
  { canonical: "User Research", category: "product_design" },
  { canonical: "Design Systems", category: "product_design" },
  { canonical: "System Design", category: "practices", aliases: ["systems architecture", "distributed systems"] },
  { canonical: "Agile", category: "practices", aliases: ["scrum", "kanban", "sprints"] },
  { canonical: "Git", category: "practices", aliases: ["version control", "github", "gitlab"] },
  { canonical: "Security", category: "practices", aliases: ["cybersecurity", "owasp", "oauth", "jwt"] },
  { canonical: "Accessibility", category: "practices", aliases: ["a11y", "wcag"] },
  { canonical: "Performance Optimization", category: "practices", aliases: ["web performance", "lighthouse", "core web vitals"] },

  // Business, Marketing & Data Analysis
  { canonical: "Power BI", category: "business_marketing", aliases: ["powerbi"] },
  { canonical: "Tableau", category: "business_marketing" },
  { canonical: "Excel", category: "business_marketing", aliases: ["advanced excel", "vlookup", "pivot tables"] },
  { canonical: "A/B Testing", category: "business_marketing", aliases: ["split testing"] },
  { canonical: "Google Analytics", category: "business_marketing", aliases: ["ga4"] },
  { canonical: "SEO", category: "business_marketing", aliases: ["search engine optimization"] },
  { canonical: "SEM", category: "business_marketing", aliases: ["search engine marketing", "google ads"] },
  { canonical: "Content Strategy", category: "business_marketing", aliases: ["content marketing"] },
  { canonical: "Copywriting", category: "business_marketing" },
  { canonical: "CRM", category: "business_marketing", aliases: ["hubspot", "salesforce"] },
  { canonical: "KPI Tracking", category: "business_marketing", aliases: ["metrics tracking", "kpis"] },
  { canonical: "Data Modeling", category: "business_marketing" },

  // Healthcare, Clinical & Nursing
  { canonical: "Patient Care", category: "healthcare_nursing" },
  { canonical: "Clinical Assessment", category: "healthcare_nursing", aliases: ["patient assessment"] },
  { canonical: "Medication Administration", category: "healthcare_nursing", aliases: ["med administration", "pharmacology"] },
  { canonical: "Vital Signs", category: "healthcare_nursing", aliases: ["vitals"] },
  { canonical: "CPR / BLS", category: "healthcare_nursing", aliases: ["cpr", "bls", "basic life support", "acls"] },
  { canonical: "HIPAA", category: "healthcare_nursing", aliases: ["hipaa compliance"] },
  { canonical: "Electronic Health Records", category: "healthcare_nursing", aliases: ["ehr", "emr", "epic", "cerner"] },
  { canonical: "Triage", category: "healthcare_nursing" },
  { canonical: "Patient Education", category: "healthcare_nursing" },
  { canonical: "Phlebotomy", category: "healthcare_nursing", aliases: ["blood draw"] },
  { canonical: "Wound Care", category: "healthcare_nursing" },
];

// Pre-computed lookup map: lower-cased alias or canonical -> canonical
export const SKILL_ALIAS_MAP: Map<string, string> = new Map();

for (const skill of SKILLS_CATALOG) {
  SKILL_ALIAS_MAP.set(skill.canonical.toLowerCase(), skill.canonical);
  if (skill.aliases) {
    for (const alias of skill.aliases) {
      SKILL_ALIAS_MAP.set(alias.toLowerCase(), skill.canonical);
    }
  }
}
