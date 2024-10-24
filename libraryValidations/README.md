# Library Validations

The contained folders include test cases to verify that all the Feature Management libraries work exactly the same.

In some cases, the full flow requires usage of Azure App Configuration and the associated provider library. For example telemetry requires additional fields.

To test with Azure App Configuration, use the `deploy.ps1` script which will create an Azure App Configuration store and a linked Application Insights resource. It will also create the required keys needed for the tests.

Once deployed, create an environment variable named `APP_CONFIG_VALIDATION_CONNECTION_STRING` with the connection string of the Azure App Configuration store.
