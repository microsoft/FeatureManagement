// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
using Dotnet;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.FeatureManagement;
using Microsoft.FeatureManagement.FeatureFilters;
using System.Text.Json;

[TestClass]
public class Tests
{
    private const string FilePath = "../../../../../Samples/";
    private const string SampleJsonKey = ".sample.json";
    private const string TestsJsonKey = ".tests.json";

    [TestMethod]
    public async Task TestNoFilters()
    {
        await RunTests("NoFilters");
    }

    [TestMethod]
    public async Task TestTimeWindowFilter()
    {
        await RunTests("TimeWindowFilter");
    }

    [TestMethod]
    public async Task TestTargetingFilter()
    {
        await RunTests("TargetingFilter");
    }

    [TestMethod]
    public async Task TestTargetingFilterModified()
    {
        await RunTests("TargetingFilter.modified");
    }

    [TestMethod]
    public async Task TestRequirementType()
    {
        await RunTests("RequirementType");
    }

    [TestMethod]
    public async Task TestBasicVariant()
    {
        await RunTests("BasicVariant");
    }

    private async Task RunTests(string testKey)
    {
        // Use Sample JSON as Configuration
        string file = Directory.GetFiles(FilePath, testKey + SampleJsonKey).First();

        ConfigurationBuilder builder = new ConfigurationBuilder();

        builder.AddJsonFile(Path.GetFullPath(file));

        IConfiguration configuration = builder.Build();

        // Setup FeatureManagement
        IServiceCollection services = new ServiceCollection();

        services.AddSingleton(configuration)
                .AddFeatureManagement();

        ServiceProvider serviceProvider = services.BuildServiceProvider();
        IVariantFeatureManager featureManager = serviceProvider.GetRequiredService<IVariantFeatureManager>();

        // Get Test Suite JSON
        var featureFlagTests = JsonSerializer.Deserialize<SharedTest[]>(File.ReadAllText(FilePath + testKey + TestsJsonKey), new JsonSerializerOptions
        {
            Converters = { new UnknownJsonFieldConverter() }
        });

        if (featureFlagTests == null) {
            throw new Exception("Test failed to parse JSON");
        }

        // Run each test
        foreach (var featureFlagTest in featureFlagTests)
        {
            string featureFlagId = testKey + "." + featureFlagTest.FeatureFlagName;
            string failedDescription = $"Test {featureFlagId} failed. Description: {featureFlagTest.Description}";

            // IsEnabledAsync
            if (featureFlagTest.IsEnabled != null)
            {
                bool? expectedIsEnabledResult = featureFlagTest.IsEnabled.Result != null ? Convert.ToBoolean(featureFlagTest.IsEnabled.Result) : null;

                if (featureFlagTest.IsEnabled.Exception != null)
                {
                    await Assert.ThrowsExceptionAsync<FeatureManagementException>(async () => await featureManager.IsEnabledAsync(featureFlagTest.FeatureFlagName), featureFlagTest.IsEnabled.Exception);
                }
                else
                {
                    bool isEnabledResult = await featureManager.IsEnabledAsync(featureFlagTest.FeatureFlagName, new TargetingContext { UserId = featureFlagTest.Inputs.User, Groups = featureFlagTest.Inputs.Groups });
                    Assert.AreEqual(expectedIsEnabledResult, isEnabledResult, failedDescription);
                }
            }

            // GetVariantAsync
            if (featureFlagTest.Variant != null)
            {
                if (featureFlagTest.Variant.Exception != null)
                {
                    await Assert.ThrowsExceptionAsync<FeatureManagementException>(async () => await featureManager.GetVariantAsync(featureFlagTest.FeatureFlagName), featureFlagTest.Variant.Exception);
                }
                else
                {
                    Variant variantResult = await featureManager.GetVariantAsync(featureFlagTest.FeatureFlagName, new TargetingContext { UserId = featureFlagTest.Inputs.User, Groups = featureFlagTest.Inputs.Groups });
                    
                    if (featureFlagTest.Variant.Result == null) {
                        Assert.IsNull(variantResult);
                    } else {
                        if (featureFlagTest.Variant.Result.ConfigurationValue is string value)
                        {
                            Assert.AreEqual(value, variantResult?.Configuration.Value, failedDescription);
                        } 
                        else 
                        {
                            Assert.Fail();
                        }
                    }
                }
            }
        }
    }
}