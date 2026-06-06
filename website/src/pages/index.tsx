import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

// Component: Hero Section
function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={clsx('container', styles.heroContainer)}>
        <div className={styles.heroLeft}>
          <div className={styles.eyebrowBadge}>
            <span>Open-source infrastructure testing for IaC</span>
          </div>
          <Heading as="h1" className={styles.heroTitle}>
            Test infrastructure stacks before they surprise you.
          </Heading>
          <p className={styles.heroSubtitle}>
            StackTest runs repeatable infrastructure tests across IaC tools and cloud providers, validates outcomes, protects cleanup with ownership checks, and produces CI-friendly reports.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started/what-is-stacktest">
              Get Started
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="https://github.com/gattasrikanth/stacktest">
              View on GitHub
            </Link>
          </div>
          <div className={styles.trustHints}>
            <span className={styles.trustHint}>
              <span className={styles.checkMark}>✓</span> Provider-agnostic core
            </span>
            <span className={styles.trustHint}>
              <span className={styles.checkMark}>✓</span> Safety-first cleanup
            </span>
            <span className={styles.trustHint}>
              <span className={styles.checkMark}>✓</span> CI-ready reports
            </span>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.terminalCard}>
            <div className={styles.terminalHeader}>
              <span className={clsx(styles.terminalDot, styles.dotRed)}></span>
              <span className={clsx(styles.terminalDot, styles.dotYellow)}></span>
              <span className={clsx(styles.terminalDot, styles.dotGreen)}></span>
              <span className={styles.terminalTitle}>bash</span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.terminalLine}>
                <span className={styles.prompt}>$</span> npm create stacktest@latest
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.prompt}>$</span> cd my-iac-tests
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.prompt}>$</span> stacktest run --config stacktest.yml
              </div>
              <div className={styles.terminalOutput}>
                <span className={styles.success}>✓</span> planned 3 regions<br />
                <span className={styles.success}>✓</span> validated ownership tags<br />
                <span className={styles.success}>✓</span> deployed test stack<br />
                <span className={styles.success}>✓</span> captured outputs<br />
                <span className={styles.success}>✓</span> destroyed test resources<br />
                <span className={styles.success}>✓</span> wrote reports/html/index.html
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Component: Problem & Promise Strip
function ProblemPromiseStrip() {
  return (
    <section className={styles.stripSection}>
      <div className="container">
        <div className={styles.stripGrid}>
          <div className={styles.stripCard}>
            <div className={styles.stripCardIcon}>⚠️</div>
            <Heading as="h4" className={styles.stripCardHeading}>Failed test stacks leave expensive leftovers</Heading>
          </div>
          <div className={styles.stripCard}>
            <div className={styles.stripCardIcon}>🔥</div>
            <Heading as="h4" className={styles.stripCardHeading}>Cleanup scripts can delete the wrong resources</Heading>
          </div>
          <div className={styles.stripCard}>
            <div className={styles.stripCardIcon}>🔄</div>
            <Heading as="h4" className={styles.stripCardHeading}>IaC tools differ, but testing workflows repeat</Heading>
          </div>
        </div>
        <div className={styles.stripPromise}>
          <p>
            StackTest separates test orchestration from provider-specific logic so every provider can follow the same safe lifecycle.
          </p>
        </div>
      </div>
    </section>
  );
}

// Component: How It Works Section
function HowItWorks() {
  const steps = [
    { num: '1', title: 'Plan', desc: 'Read config, expand providers, target regions, and validate inputs.' },
    { num: '2', title: 'Deploy', desc: 'Call provider adapters to spin up fresh testing stacks.' },
    { num: '3', title: 'Validate', desc: 'Run assertions, verify outputs, and capture cloud events.' },
    { num: '4', title: 'Cleanup', desc: 'Safely destroy only resources tagged with ownership metadata.' },
    { num: '5', title: 'Report', desc: 'Generate raw JSON, JUnit XML, and visual HTML dashboards.' },
  ];

  return (
    <section className={styles.howItWorksSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Lifecycle</span>
          <Heading as="h2" className={styles.sectionTitle}>How StackTest Works</Heading>
          <p className={styles.sectionSubtitle}>
            A standardized, safe infrastructure test execution pipeline.
          </p>
        </div>
        <div className={styles.lifecycleFlow}>
          {steps.map((step, index) => (
            <div key={step.num} className={styles.lifecycleStep}>
              <div className={styles.stepHeader}>
                <div className={styles.stepNumber}>{step.num}</div>
                {index < steps.length - 1 && <div className={styles.stepConnector}></div>}
              </div>
              <div className={styles.stepContent}>
                <Heading as="h3" className={styles.stepTitle}>{step.title}</Heading>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Component: Quick Start Preview Section
function QuickStartPreview() {
  const yamlContent = `name: cfn-smoke-test
providers:
  aws-cloudformation:
    regions: [us-east-1, us-west-2]

tests:
  - name: vpc-template
    template: ./templates/vpc.yml
    parameters:
      EnvironmentName: stacktest-dev`;

  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <div className={styles.quickStartContainer}>
          <div className={styles.quickStartLeft}>
            <span className={styles.sectionEyebrow}>Simple Setup</span>
            <Heading as="h2" className={styles.sectionTitle}>Get started in minutes</Heading>
            <p className={styles.sectionSubtitle}>
              Define your providers, target regions, templates, and environment variables in a single declarative <code>stacktest.yml</code> file. StackTest handles the execution and cleanup loop automatically.
            </p>
            <div className={styles.quickStartActions}>
              <Link className="button button--primary button--lg" to="/docs/getting-started/quick-start">
                Read the Quick Start
              </Link>
            </div>
          </div>
          <div className={styles.quickStartRight}>
            <div className={styles.codeCard}>
              <div className={styles.codeCardHeader}>
                <span>stacktest.yml</span>
                <span className={styles.codeCardLang}>YAML</span>
              </div>
              <div className={styles.codeCardBody}>
                <pre className={styles.codePre}><code>{yamlContent}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Component: Reports Preview Section
function ReportsPreview() {
  return (
    <section className={styles.reportsSection}>
      <div className="container">
        <div className={styles.reportsContainer}>
          <div className={styles.reportsLeft}>
            <div className={styles.reportMockCard}>
              <div className={styles.reportMockHeader}>
                <div className={styles.reportMockTitleGroup}>
                  <strong className={styles.reportMockTitle}>StackTest Run Dashboard</strong>
                  <span className={styles.reportMockSub}>cfn-smoke-test • Run #142</span>
                </div>
                <div className={clsx(styles.reportBadge, styles.badgeSuccess)}>PASSED</div>
              </div>
              <div className={styles.reportMockSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Tests</span>
                  <span className={styles.summaryValue}>3</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Passed</span>
                  <span className={clsx(styles.summaryValue, styles.textSuccess)}>3</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Failed</span>
                  <span className={styles.summaryValue}>0</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Duration</span>
                  <span className={styles.summaryValue}>2m 45s</span>
                </div>
              </div>
              <div className={styles.reportMockList}>
                <div className={styles.reportListItem}>
                  <span className={styles.reportStatusOk}>✓</span>
                  <span className={styles.reportName}>aws-cloudformation:us-east-1:vpc-template</span>
                  <span className={styles.reportTime}>1m 12s</span>
                </div>
                <div className={styles.reportListItem}>
                  <span className={styles.reportStatusOk}>✓</span>
                  <span className={styles.reportName}>aws-cloudformation:us-west-2:vpc-template</span>
                  <span className={styles.reportTime}>1m 18s</span>
                </div>
                <div className={styles.reportListItem}>
                  <span className={styles.reportStatusOk}>✓</span>
                  <span className={styles.reportCleanup}>Cleanup verified (0 orphaned resources)</span>
                  <span className={styles.reportTime}>15s</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.reportsRight}>
            <span className={styles.sectionEyebrow}>Verification & Reports</span>
            <Heading as="h2" className={styles.sectionTitle}>Deep insights, automated feedback</Heading>
            <p className={styles.sectionSubtitle}>
              StackTest outputs full reports designed for both humans and CI integrations. Verify test coverage, inspect parameters, track durations, and confirm cleanup success instantly.
            </p>
            <div className={styles.reportsFormats}>
              <div className={styles.formatBadge}>
                <strong>JSON</strong>
                <span>Custom scripting</span>
              </div>
              <div className={styles.formatBadge}>
                <strong>JUnit XML</strong>
                <span>CI/CD pipeline test parsing</span>
              </div>
              <div className={styles.formatBadge}>
                <strong>HTML Dashboard</strong>
                <span>Interactive standalone visualizer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Component: Final CTA Section
function FinalCTA() {
  return (
    <section className={styles.finalCTASection}>
      <div className="container">
        <div className={styles.finalCTAContent}>
          <Heading as="h2" className={styles.finalCTATitle}>Start with one template. Add providers later.</Heading>
          <p className={styles.finalCTADesc}>
            Protect your active infrastructure and start verifying your deployments with safety first.
          </p>
          <div className={styles.finalCTAButtons}>
            <Link className="button button--primary button--lg" to="/docs/getting-started/quick-start">
              Read the Quick Start
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/core-concepts/overview">
              Explore the Architecture
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | Multi-cloud IaC Testing`}
      description="StackTest is an open-source, provider-agnostic infrastructure testing framework for CloudFormation, Terraform, AWS CDK, Pulumi, Kubernetes, and Azure Bicep workflows.">
      <HomepageHeader />
      <main>
        <ProblemPromiseStrip />
        <HowItWorks />
        <HomepageFeatures />
        <QuickStartPreview />
        <ReportsPreview />
        <FinalCTA />
      </main>
    </Layout>
  );
}
