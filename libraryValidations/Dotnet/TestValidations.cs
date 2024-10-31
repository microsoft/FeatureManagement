// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
using Dotnet;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.FeatureManagement;
using Microsoft.FeatureManagement.FeatureFilters;
using System.Diagnostics;
using System.Text.Json;

[TestClass]
public class Tests
{
    private const string FilePath = "../../../../../Samples/";
    private const string SampleJsonKey = ".sample.json";
    private const string TestsJsonKey = ".tests.json";

    private ActivityListener _activityListener;

    [TestMethod]
    [DataRow("NoFilters")]
    [DataRow("TimeWindowFilter")]
    [DataRow("TargetingFilter")]
    [DataRow("TargetingFilter.modified")]
    [DataRow("RequirementType")]
    [DataRow("BasicVariant")]
    public async Task RunTestFile(string fileName)
    {
        // Use Sample JSON as Configuration
        string file = Directory.GetFiles(FilePath, fileName + SampleJsonKey).First();

        ConfigurationBuilder builder = new ConfigurationBuilder();

        builder.AddJsonFile(Path.GetFullPath(file));

        IConfiguration configuration = builder.Build();

        // Setup FeatureManagement
        IServiceCollection services = new ServiceCollection();

        services.AddSingleton(configuration)
                .AddFeatureManagement();

        ServiceProvider serviceProvider = services.BuildServiceProvider();
        IVariantFeatureManager featureManager = serviceProvider.GetRequiredService<IVariantFeatureManager>();

        await RunTests(featureManager, fileName);
    }

    [TestMethod]
    public async Task RunProviderTestFile()
    {
        // Use Provider for Configuration
        IConfiguration configuration = new ConfigurationBuilder()
            .AddAzureAppConfiguration(o =>
            {
                o.Connect(Environment.GetEnvironmentVariable("APP_CONFIG_VALIDATION_CONNECTION_STRING"));

                o.UseFeatureFlags();
            })
            .Build();

        // Setup FeatureManagement
        IServiceCollection services = new ServiceCollection();

        services.AddSingleton(configuration)
                .AddFeatureManagement();

        ServiceProvider serviceProvider = services.BuildServiceProvider();
        IVariantFeatureManager featureManager = serviceProvider.GetRequiredService<IVariantFeatureManager>();

        // Cant 
        await RunTests(featureManager, "ProviderTelemetry");
        await RunTests(featureManager, "ProviderTelemetryComplete");
    }

    private async Task RunTests(IVariantFeatureManager featureManager, string fileName)
    {
        // Get Test Suite JSON
        var featureFlagTests = JsonSerializer.Deserialize<SharedTest[]>(File.ReadAllText(FilePath + fileName + TestsJsonKey), new JsonSerializerOptions
        {
            Converters = { new UnknownJsonFieldConverter() }
        });

        if (featureFlagTests == null) {
            throw new Exception("Test failed to parse JSON");
        }

        // Run each test
        foreach (var featureFlagTest in featureFlagTests)
        {
            string featureFlagId = fileName + "." + featureFlagTest.FeatureFlagName;
            string failedDescription = $"Test {featureFlagId} failed. Description: {featureFlagTest.Description}";

            // Setup Activity Listener if we're validating Telemetry
            if (featureFlagTest.Telemetry != null)
            {
                SetupActivityListener(featureFlagTest, failedDescription);
            }

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

                    if (featureFlagTest.Variant.Result == null)
                    {
                        Assert.IsNull(variantResult);
                    }
                    else
                    {
                        ValidateJsonConfigurationValue(featureFlagTest.Variant.Result.ConfigurationValue, variantResult.Configuration);
                    }
                }
            }

            if (featureFlagTest.Telemetry != null)
            {
                _activityListener.Dispose();
            }
        }
    }

    private void SetupActivityListener(SharedTest featureFlagTest, string failedDescription)
    {
        _activityListener = new ActivityListener
        {
            ShouldListenTo = (activitySource) => activitySource.Name == "Microsoft.FeatureManagement",
            Sample = (ref ActivityCreationOptions<ActivityContext> options) => ActivitySamplingResult.AllData,
            ActivityStopped = (activity) =>
            {
                ActivityEvent? evaluationEvent = activity.Events.FirstOrDefault((activityEvent) => activityEvent.Name == "FeatureFlag");

                if (evaluationEvent.HasValue && evaluationEvent.Value.Tags.Any())
                {
                    Dictionary<string, object?> evaluationEventProperties = evaluationEvent.Value.Tags.ToDictionary((tag) => tag.Key, (tag) => tag.Value);

                    foreach (var property in featureFlagTest.Telemetry.EventProperties)
                    {
                        Assert.IsTrue(evaluationEventProperties.ContainsKey(property.Key), failedDescription);

                        if (property.Key == "FeatureFlagReference")
                        {
                            Assert.IsTrue(evaluationEventProperties[property.Key]?.ToString()?.EndsWith(property.Value));
                        }
                        else
                        {
                            Assert.AreEqual(property.Value, evaluationEventProperties[property.Key]?.ToString(), failedDescription);
                        }
                    }
                }
            }
        };

        ActivitySource.AddActivityListener(_activityListener);
    }

    private void ValidateJsonConfigurationValue(JsonElement? ele, IConfigurationSection configuration)
    {
        if (ele == null) {
            Assert.IsNull(configuration.Get<string>());
        }
        if (ele.Value.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in ele.Value.EnumerateObject())
            {
                ValidateProperty(property.Value, configuration.GetSection(property.Name));
            }
        } else if (ele.Value.ValueKind == JsonValueKind.Array)
        {
            for (int i = 0; i < ele.Value.GetArrayLength(); i++)
            {
                ValidateProperty(ele.Value[i], configuration.GetSection(i.ToString()));
            }
        } else
        {
            ValidateProperty(ele.Value, configuration);
        }
    }

    private void ValidateProperty(JsonElement value, IConfigurationSection configuration)
    {
        if (value.ValueKind == JsonValueKind.String)
        {
            Assert.AreEqual(value.GetString(), configuration?.Get<string>());
        }
        else if (value.ValueKind == JsonValueKind.Number)
        {
            Assert.AreEqual(value.GetDouble(), configuration?.Get<double>());
        }
        else if (value.ValueKind == JsonValueKind.Null)
        {
            Assert.IsNull(configuration?.Get<string>());
        }
        else if (value.ValueKind == JsonValueKind.False)
        {
            Assert.IsFalse(configuration?.Get<bool>());
        }
        else if (value.ValueKind == JsonValueKind.True)
        {
            Assert.IsTrue(configuration?.Get<bool>());
        }
        else if (value.ValueKind == JsonValueKind.Object)
        {
            ValidateJsonConfigurationValue(value, configuration);
        }
        else if (value.ValueKind == JsonValueKind.Array)
        {
            ValidateJsonConfigurationValue(value, configuration);
        } else
        {
            Assert.Fail();
        }
    }
}