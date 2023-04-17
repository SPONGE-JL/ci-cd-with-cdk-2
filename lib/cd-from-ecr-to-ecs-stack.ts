import * as cdk from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_ecs_patterns as ecs_patterns } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { aws_codepipeline as codepipeline } from 'aws-cdk-lib';
import { aws_codepipeline_actions as codepipeline_actions } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface CDFromEcrToEcsStackProps extends cdk.StackProps {
  ecrRepository: ecr.Repository;
}

export class CDFromEcrToEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CDFromEcrToEcsStackProps) {
    super(scope, id, props);

    // ECS 클러스터 생성
    const ecsCluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc: new ec2.Vpc(this, 'Vpc'),
    });

    // ECS 서비스 생성
    const ecsService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'EcsService', {
      cluster: ecsCluster,
      taskImageOptions: {
        containerName: 'MyAppContainer',
        image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository, 'latest'),
        containerPort: 8080, // 컨테이너의 포트를 8080으로 설정
      },
      listenerPort: 80, // 로드 밸런서의 리스너 포트를 80으로 설정
      targetProtocol: ApplicationProtocol.HTTP, // 로드 밸런서의 타겟 프로토콜을 HTTP로 설정
    });

    // 파이프라인 생성
    const deployPipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'microservice-a-cd-pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.EcrSourceAction({
              actionName: 'ECR_Source',
              repository: props.ecrRepository,
              imageTag: 'latest',
              output: new codepipeline.Artifact('EcrOutput'),
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'ECS_Deploy',
              service: ecsService.service,
              input: new codepipeline.Artifact('EcrOutput'),
            }),
          ],
        },
      ],
    });
  }
}
