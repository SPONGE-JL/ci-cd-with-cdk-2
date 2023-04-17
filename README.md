# CI/CD with CDK 2

```bash
# node ^18
npm install -g aws-cdk@v2

# Only once
cdk bootstrap
```

```bash
# Install depenency
npm ci

# Compile
npm build
```

```bash
# Provisioning CI stack
cdk deploy CIFromRepoToEcrStack

# Then, push 'latest' tagged image to provisioned ECR repository

# Provisioing CD stack
cdk deploy CDFromEcrToEcsStack
```

```bash
# Clean up
cdk destroy CDFromEcrToEcsStack
cdk destroy CIFromRepoToEcrStack
```
