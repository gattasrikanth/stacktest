# Artifacts

To deploy templates (like large CloudFormation structures or nested stacks), StackTest needs a way to store and reference staging resources.

For example, the AWS CloudFormation provider automatically:
1. Provisions regional staging S3 buckets named `stacktest-<project>-<region>-<run-id>`.
2. Uploads templates to these S3 locations.
3. Passes the URL to the CloudFormation CreateStack command.
4. Cleans up these staging objects and buckets upon execution teardown.
