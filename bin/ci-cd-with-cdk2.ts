#!/usr/bin/env node
import 'source-map-support/register';
import { CIFromRepoToEcrStack } from '../lib/ci-from-repo-to-ecr-stack';
import { CDFromEcrToEcsStack } from '../lib/cd-from-ecr-to-ecs-stack';
import { App } from 'aws-cdk-lib';

const app = new App();
const ci = new CIFromRepoToEcrStack(app, 'CIFromRepoToEcrStack');
new CDFromEcrToEcsStack(app, 'CDFromEcrToEcsStack', { ecrRepository: ci.ecrRepository });
app.synth();
