import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
  docLink?: string;
  linkLabel?: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Provider-Agnostic Core',
    icon: '🔌',
    description: (
      <>
        Decoupled planning allows running the exact same test suites across CloudFormation, Terraform, AWS CDK, Pulumi, Kubernetes, and Azure Bicep.
      </>
    ),
    docLink: '/docs/core-concepts/providers',
    linkLabel: 'Learn about providers',
  },
  {
    title: 'Safe Cleanup by Design',
    icon: '🛡️',
    description: (
      <>
        Strict ownership tag verification ensures StackTest only destroys resources it created, leaving existing infrastructure completely untouched.
      </>
    ),
    docLink: '/docs/core-concepts/cleanup-destroy',
    linkLabel: 'See safety details',
  },
  {
    title: 'Dynamic Parameters',
    icon: '🎛️',
    description: (
      <>
        Inject dynamic runtime variables, generate unique resource names, and override parameters dynamically per region and test run.
      </>
    ),
    docLink: '/docs/core-concepts/parameters',
    linkLabel: 'Explore parameters',
  },
  {
    title: 'CI-Friendly Reporting',
    icon: '📊',
    description: (
      <>
        Generate raw JSON for custom tools, standard JUnit XML for CI/CD pipeline integration, and beautiful interactive HTML dashboards.
      </>
    ),
    docLink: '/docs/core-concepts/reports',
    linkLabel: 'Read about reports',
  },
  {
    title: 'Local-First Development',
    icon: '💻',
    description: (
      <>
        Test infrastructure directly from your local terminal or IDE with instant feedback loop before pushing code to remote branches.
      </>
    ),
    docLink: '/docs/getting-started/installation',
    linkLabel: 'Install CLI tool',
  },
  {
    title: 'Agent-Friendly Docs',
    icon: '🤖',
    description: (
      <>
        Pre-packaged configuration rules, strict YAML schemas, and AI-focused guidelines designed to make coding agents extremely productive.
      </>
    ),
    docLink: '/docs/ai/agent-guide',
    linkLabel: 'Read Agent guidelines',
  },
];

function Feature({title, icon, description, docLink, linkLabel}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <div className={styles.featureCard}>
        <div className={styles.iconContainer}>{icon}</div>
        <div className={styles.cardContent}>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <p className={styles.featureDescription}>{description}</p>
          {docLink && (
            <Link className={styles.featureLink} to={docLink}>
              {linkLabel || 'Read more'} &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Core Capabilities</span>
          <Heading as="h2" className={styles.sectionTitle}>Built for robust infrastructure delivery</Heading>
          <p className={styles.sectionSubtitle}>Everything you need to validate stacks and keep cloud environments tidy.</p>
        </div>
        <div className="row">
          {FeatureList.map((props) => (
            <Feature key={props.title} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
