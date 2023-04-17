import * as cdk from 'aws-cdk-lib';
import { aws_codecommit as codecommit } from 'aws-cdk-lib';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';
import { aws_codepipeline as codepipeline } from 'aws-cdk-lib';
import { aws_codepipeline_actions as codepipeline_actions } from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CIFromRepoToEcrStack extends cdk.Stack {
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 코드 저장소 생성
    const repo = new codecommit.Repository(this, 'Repository', {
      repositoryName: 'microservice-a',
    });

    // ECR 리포지토리 생성
    const ecrRepository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: 'microservice-a',
    });
    this.ecrRepository = ecrRepository;

    // 빌드 프로젝트 생성
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo Building the Docker image...',
              'docker build -t $REPOSITORY_URI:$IMAGE_TAG .',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing the Docker image...',
              'docker push $REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
    });

    // 파이프라인 생성
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'microservice-a-ci-pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_Source',
              repository: repo,
              output: new codepipeline.Artifact('SourceOutput'),
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Docker_Build',
              project: buildProject,
              input: new codepipeline.Artifact('SourceOutput'),
              outputs: [new codepipeline.Artifact('BuildOutput')],
              environmentVariables: {
                'REPOSITORY_URI': { value: ecrRepository.repositoryUri },
                'IMAGE_TAG': { value: 'latest' },
              },
            }),
          ],
        },
      ],
    });
  }
}
