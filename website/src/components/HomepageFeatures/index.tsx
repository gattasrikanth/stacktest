import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Provider-Agnostic Core',
    description: (
      <>
        Decoupled test planning and orchestration allows running tests across CloudFormation, Terraform, AWS CDK, Pulumi, Kubernetes, and Azure Bicep.
      </>
    ),
  },
  {
    title: 'Safety First',
    description: (
      <>
        Destructive cleanup operations strictly validate ownership tagging before resource destruction, guaranteeing StackTest never affects external infrastructure.
      </>
    ),
  },
  {
    title: 'Rich Execution Reports',
    description: (
      <>
        Outputs detailed execution summaries including raw JSON reports, standard JUnit XML for CI integrations, and beautiful standalone interactive HTML dashboards.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md" style={{ marginTop: '2rem' }}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
