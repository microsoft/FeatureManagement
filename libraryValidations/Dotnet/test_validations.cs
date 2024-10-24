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

    public required IFeatureManager featureManager;

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
        featureManager = serviceProvider.GetRequiredService<IFeatureManager>();

        // Get Test Suite JSON
        var featureFlagTests = JsonSerializer.Deserialize<SharedTest[]>(File.ReadAllText(FilePath + testKey + TestsJsonKey));

        if (featureFlagTests == null) {
            throw new Exception("Test failed to parse JSON");
        }

        // Run each test
        foreach (var featureFlagTest in featureFlagTests)
        {
            bool? expectedIsEnabledResult = featureFlagTest.IsEnabled?.Result != null ? Convert.ToBoolean(featureFlagTest.IsEnabled?.Result) : null;
            string featureFlagId = testKey + "." + featureFlagTest.FeatureFlagName;
            string failedDescription = $"Test {featureFlagId} failed. Description: {featureFlagTest.Description}";

            if (featureFlagTest.IsEnabled != null)
            {
                if (expectedIsEnabledResult != null)
                {
                    bool isEnabledResult = await featureManager.IsEnabledAsync(featureFlagTest.FeatureFlagName, new TargetingContext { UserId = featureFlagTest.Inputs.user, Groups = featureFlagTest.Inputs.groups });
                    Assert.AreEqual(expectedIsEnabledResult, isEnabledResult, failedDescription);
                }
                else
                {
                    await Assert.ThrowsExceptionAsync<FeatureManagementException>(async () => await featureManager.IsEnabledAsync(featureFlagTest.FeatureFlagName), featureFlagTest.IsEnabled.Exception);
                }
            }
        }
    }
}