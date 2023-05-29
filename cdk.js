"use strict";
exports.__esModule = true;
var cdk = require("aws-cdk-lib");
var s3 = require("aws-cdk-lib/aws-s3");
var deployment = require("aws-cdk-lib/aws-s3-deployment");
var cf = require("aws-cdk-lib/aws-cloudfront");
var origins = require("aws-cdk-lib/aws-cloudfront-origins");
var app = new cdk.App();
var stack = new cdk.Stack(app, 'RSSchoolShopApp', {
    env: { region: 'eu-central-1' }
});
var bucket = new s3.Bucket(stack, 'WebAppBucket', {
    bucketName: 'rs-school-shop-app',
    publicReadAccess: false,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
});
var originAccessIdentity = new cf.OriginAccessIdentity(stack, 'WebAppBucketOAI', {
    comment: bucket.bucketName
});
bucket.grantRead(originAccessIdentity);
var cloudfront = new cf.Distribution(stack, 'WebAppDistribution', {
    defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
            originAccessIdentity: originAccessIdentity
        }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    },
    defaultRootObject: 'index.html',
    errorResponses: [
        {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html'
        },
    ]
});
new deployment.BucketDeployment(stack, 'WebAppDeploy', {
    destinationBucket: bucket,
    sources: [deployment.Source.asset('./dist')],
    distribution: cloudfront,
    distributionPaths: ['/*']
});
new cdk.CfnOutput(stack, 'Domain URL', {
    value: cloudfront.distributionDomainName
});
