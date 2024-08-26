# Microsoft Feature Management

Traditionally, shipping a new application feature requires a complete redeployment of the application itself. Testing a feature often requires multiple deployments of the application. Each deployment might change the feature or expose the feature to different customers for testing.  

Feature management is a modern software-development practice that decouples feature release from code deployment and enables quick changes to feature availability on demand. It uses a technique called *feature flags* (also known as *feature toggles* and *feature switches*) to dynamically administer a feature's lifecycle.

Feature management helps developers address the following problems:

* **Code branch management**: Use feature flags to wrap new application functionality currently under development. Such functionality is "hidden" by default. You can safely ship the feature, even though it's unfinished, and it will stay dormant in production. Using this approach, called *dark deployment*, you can release all your code at the end of each development cycle. You no longer need to maintain code branches across multiple development cycles because a given feature requires more than one cycle to complete.
* **Test in production**: Use feature flags to grant early access to new functionality in production. For example, you can limit access to team members or to internal beta testers. These users will experience the full-fidelity production experience instead of a simulated or partial experience in a test environment.
* **Flighting**: Use feature flags to incrementally roll out new functionality to end users. You can target a small percentage of your user population first and increase that percentage gradually over time.
* **Instant kill switch**: Feature flags provide an inherent safety net for releasing new functionality. You can turn application features on and off without redeploying any code. If necessary, you can quickly disable a feature without rebuilding and redeploying your application.
* **Selective activation**: Use feature flags to segment your users and deliver a specific set of features to each group. You might have a feature that works only on a certain web browser. You can define a feature flag so that only users of that browser can see and use the feature. By using this approach, you can easily expand the supported browser list later without having to make any code changes.

## Client Libraries

Module | Platform | Sample | Release Notes
------ | -------- | ------ | -------------
[Microsoft.FeatureManagement](https://github.com/microsoft/FeatureManagement-Dotnet)<br/>[![NuGet](https://img.shields.io/nuget/v/Microsoft.FeatureManagement.svg?color=blue)](https://www.nuget.org/packages/Microsoft.FeatureManagement)| .NET Standard | [Sample](https://github.com/microsoft/FeatureManagement-Dotnet/tree/main/examples) | [Release Notes](https://github.com/Azure/AppConfiguration/blob/main/releaseNotes/Microsoft.Featuremanagement.md)
[Microsoft.FeatureManagement.AspNetCore](https://github.com/microsoft/FeatureManagement-Dotnet)<br/>[![NuGet](https://img.shields.io/nuget/v/Microsoft.FeatureManagement.AspNetCore.svg?color=blue)](https://www.nuget.org/packages/Microsoft.FeatureManagement.AspNetCore) | ASP&#46;NET Core | [Sample](https://github.com/microsoft/FeatureManagement-Dotnet/tree/main/examples) | [Release Notes](https://github.com/Azure/AppConfiguration/blob/main/releaseNotes/Microsoft.Featuremanagement.md)
[spring-cloud-azure-feature-management](https://github.com/Azure/azure-sdk-for-java/tree/main/sdk/spring/spring-cloud-azure-feature-management)<br/>[![Maven Central](https://img.shields.io/maven-central/v/com.azure.spring/spring-cloud-azure-feature-management.svg?color=blue)](https://search.maven.org/artifact/com.azure.spring/spring-cloud-azure-feature-management) | Spring Boot | [Sample](https://github.com/Azure-Samples/azure-spring-boot-samples/tree/main/appconfiguration/spring-cloud-azure-feature-management/spring-cloud-azure-feature-management-sample) | [Release Notes](https://github.com/Azure/AppConfiguration/blob/main/releaseNotes/SpringCloudAzureFeatureManagement.md)
[spring-cloud-azure-feature-management-web](https://github.com/Azure/azure-sdk-for-java/tree/main/sdk/spring/spring-cloud-azure-feature-management-web)<br/>[![Maven Central](https://img.shields.io/maven-central/v/com.azure.spring/spring-cloud-azure-feature-management-web.svg?color=blue)](https://search.maven.org/artifact/com.azure.spring/spring-cloud-azure-feature-management-web) | Spring Boot | [Sample](https://github.com/Azure-Samples/azure-spring-boot-samples/tree/main/appconfiguration/spring-cloud-azure-feature-management-web/spring-cloud-azure-feature-management-web-sample) | [Release Notes](https://github.com/Azure/AppConfiguration/blob/main/releaseNotes/SpringCloudAzureFeatureManagement.md)
[FeatureManagement](https://github.com/microsoft/FeatureManagement-Python)<br/>[![Pypi](https://img.shields.io/pypi/v/FeatureManagement?color=blue)](https://pypi.org/project/FeatureManagement/)| Python | [Sample](https://github.com/microsoft/FeatureManagement-Python/tree/main/samples) | [Release Notes](https://github.com/Azure/AppConfiguration/blob/main/releaseNotes/PythonFeatureManagement.md)
[FeatureManagement-JavaScript](https://github.com/microsoft/FeatureManagement-JavaScript)<br/>[![Npm](https://img.shields.io/npm/v/%40microsoft%2Ffeature-management?color=blue)](https://www.npmjs.com/package/@microsoft/feature-management)| JavaScript | [Sample](https://github.com/microsoft/FeatureManagement-JavaScript) | [Release Notes](https://github.com/Azure/AppConfiguration/blob/main/releaseNotes/)

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
