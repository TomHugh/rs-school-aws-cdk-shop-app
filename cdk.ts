import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'RSSchoolShopApp', {
    env: {region: 'eu-central-1'},
});

const bucket = new s3.Bucket(stack, 'WebAppBucket', {
    bucketName: 'rs-school-shop-app',
    publicReadAccess: false,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
});

const originAccessIdentity = new cf.OriginAccessIdentity(stack, 'WebAppBucketOAI', {
    comment: bucket.bucketName,
});
bucket.grantRead(originAccessIdentity);

const cloudfront = new cf.Distribution(stack, 'WebAppDistribution', {
    defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
            originAccessIdentity,
        }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
    defaultRootObject: 'index.html',
    errorResponses: [
        {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
        },
    ],
});

new deployment.BucketDeployment(stack, 'WebAppDeploy', {
    destinationBucket: bucket,
    sources: [deployment.Source.asset('./dist')],
    distribution: cloudfront,
    distributionPaths: ['/*'],
});

new cdk.CfnOutput(stack, 'Domain URL', {
    value: cloudfront.distributionDomainName,
});