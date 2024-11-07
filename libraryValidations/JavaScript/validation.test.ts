// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from "node:fs/promises";
import * as chai from "chai";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const expect = chai.expect;

import { load } from "@azure/app-configuration-provider";
import { FeatureManager, ConfigurationObjectFeatureFlagProvider, ConfigurationMapFeatureFlagProvider } from "@microsoft/feature-management";
import { createTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-browser" ;

import { ApplicationInsights } from "@microsoft/applicationinsights-web";
const appInsights = new ApplicationInsights({ config: { connectionString: "DUMMY-CONNECTION-STRING" }});
// For telemetry validation
let eventToValidate;
let eventPropertiesToValidate;
sinon.stub(appInsights, "trackEvent").callsFake((event, customProperties) => {
    eventToValidate = event;
    eventPropertiesToValidate = customProperties;
});


const FILE_PATH = "../../Samples/"
const SAMPLE_JSON_KEY = ".sample.json"
const TESTS_JSON_KEY = ".tests.json"

interface IContext {
    User?: string;
    Groups?: string[];
}

interface IsEnabledResult {
    Result?: string;
    Exception?: string;
}

interface Variant {
    Name?: string;
    ConfigurationValue?: any;
}

interface GetVariantResult {
    Result?: null | Variant;
    Exception?: string;
}

interface FeatureEvaluationEventProperties {
    FeatureName?: string;
    Enabled?: string;
    Version?: string;
    Variant?: string;
    VariantAssignmentReason?: string;
    VariantAssignmentPercentage?: string;
    DefaultWhenEnabled?: string;
    AllocationId?: string;
    FeatureFlagId?: string;
    FeatureFlagReference?: string;
    TargetingId?: string;
}

interface TelemetryResult {
    EventName?: string;
    EventProperties?: FeatureEvaluationEventProperties;
}

interface FeatureFlagTest {
    FeatureFlagName: string;
    Inputs?: IContext;
    IsEnabled?: IsEnabledResult;
    Variant?: GetVariantResult;
    Telemetry?: TelemetryResult;
    Description?: string; 
}

async function runTest(testName: string) {
    const config = JSON.parse(await fs.readFile(FILE_PATH + testName + SAMPLE_JSON_KEY, "utf8"));
    const testcases: FeatureFlagTest[] = JSON.parse(await fs.readFile(FILE_PATH + testName + TESTS_JSON_KEY, "utf8"));
    const ffProvider = new ConfigurationObjectFeatureFlagProvider(config);
    const fm = new FeatureManager(ffProvider);

    for (const testcase of testcases){
        const featureFlagName = testcase.FeatureFlagName;
        const context = { userId: testcase.Inputs?.User, groups: testcase.Inputs?.Groups };

        if (testcase.IsEnabled) {
            if (testcase.IsEnabled.Exception !== undefined) {
                try {
                    await fm.isEnabled(featureFlagName, context);
                    expect.fail("It should throw exception.");
                } 
                catch (error) {
                    // TODO: Verify the error message after we unify it across libraries
                    // expect(error.message).to.include(testcase.IsEnabled.Exception);
                }
            } 
            else {
                expect(await fm.isEnabled(featureFlagName, context)).to.eq(testcase.IsEnabled.Result === "true");
            }
        }

        if (testcase.Variant){
            if (testcase.Variant.Exception !== undefined) {
                try {
                    await fm.getVariant(featureFlagName, context);
                    expect.fail("It should throw exception.");
                } 
                catch (error) {
                    // TODO: Verify the error message after we unify it across libraries
                    // expect(error.message).to.include(testcase.IsEnabled.Exception);
                }
            } 
            else {
                const variant = await fm.getVariant(featureFlagName, context);
                if (testcase.Variant.Result === null) {
                    expect(variant).to.be.undefined;
                } 
                else {
                    if (testcase.Variant.Result?.Name) {
                        expect(variant?.name).to.eq(testcase.Variant.Result.Name);
                    }
                    if (testcase.Variant.Result?.ConfigurationValue) {      
                        expect(variant?.configuration).to.deep.eq(testcase.Variant.Result.ConfigurationValue);
                    }
                }
            }
        }
    }
}

async function runTestWithProvider(testName: string) {
    const connectionString = process.env["APP_CONFIG_VALIDATION_CONNECTION_STRING"];
    if (connectionString === undefined) {
        console.log("Skipping test as environment variable APP_CONFIG_VALIDATION_CONNECTION_STRING is not set.");
        return;
    }
    const config = await load(
        connectionString, 
        { 
            featureFlagOptions: { 
                enabled: true,
                selectors: [
                    {
                        keyFilter: "*"
                    }
                ]
            }
        });
    const testcases: FeatureFlagTest[] = JSON.parse(await fs.readFile(FILE_PATH + testName + TESTS_JSON_KEY, "utf8"));
    const ffProvider = new ConfigurationMapFeatureFlagProvider(config);

    const fm = new FeatureManager(ffProvider, { onFeatureEvaluated: createTelemetryPublisher(appInsights) });
    for (const testcase of testcases){
        const featureFlagName = testcase.FeatureFlagName;
        const context = { userId: testcase.Inputs?.User, groups: testcase.Inputs?.Groups };

        if (testcase.IsEnabled) {
            if (testcase.IsEnabled.Exception !== undefined) {
                try {
                    await fm.isEnabled(featureFlagName, context);
                    expect.fail("It should throw exception.");
                } 
                catch (error) {
                    // TODO: Verify the error message after we unify it across libraries
                    // expect(error.message).to.include(testcase.IsEnabled.Exception);
                }
            } 
            else {
                expect(await fm.isEnabled(featureFlagName, context)).to.eq(testcase.IsEnabled.Result === "true");
            }
        }

        if (testcase.Variant){
            if (testcase.Variant.Exception !== undefined) {
                try {
                    await fm.getVariant(featureFlagName, context);
                    expect.fail("It should throw exception.");
                } 
                catch (error) {
                    // TODO: Verify the error message after we unify it across libraries
                    // expect(error.message).to.include(testcase.IsEnabled.Exception);
                }
            } 
            else {
                const variant = await fm.getVariant(featureFlagName, context);
                if (testcase.Variant.Result === null) {
                    expect(variant).to.be.undefined;
                } 
                else {
                    if (testcase.Variant.Result?.Name) {
                        expect(variant?.name).to.eq(testcase.Variant.Result.Name);
                    }
                    if (testcase.Variant.Result?.ConfigurationValue) {      
                        expect(variant?.configuration).to.deep.eq(testcase.Variant.Result.ConfigurationValue);
                    }
                }
            }
        }

        if (testcase.Telemetry?.EventName) {
            expect(eventToValidate.name).to.eq(testcase.Telemetry.EventName);
        }

        const eventProperties = testcase.Telemetry?.EventProperties;
        if (eventProperties) {
            if (eventProperties.FeatureName) {
                expect(eventPropertiesToValidate["FeatureName"]).to.eq(eventProperties.FeatureName);
            }
            if (eventProperties.Enabled) {
                expect(eventPropertiesToValidate["Enabled"]).to.eq(eventProperties.Enabled);
            }
            if (eventProperties.Version) {
                expect(eventPropertiesToValidate["Version"]).to.eq(eventProperties.Version);
            }
            if (eventProperties.Variant) {
                expect(eventPropertiesToValidate["Variant"]).to.eq(eventProperties.Variant);
            }
            if (eventProperties.VariantAssignmentReason) {
                expect(eventPropertiesToValidate["VariantAssignmentReason"]).to.eq(eventProperties.VariantAssignmentReason);
            }
            if (eventProperties.VariantAssignmentPercentage) {
                expect(eventPropertiesToValidate["VariantAssignmentPercentage"]).to.eq(eventProperties.VariantAssignmentPercentage);
            }
            if (eventProperties.DefaultWhenEnabled) {
                expect(eventPropertiesToValidate["DefaultWhenEnabled"]).to.eq(eventProperties.DefaultWhenEnabled);
            }
            if (eventProperties.AllocationId) {
                expect(eventPropertiesToValidate["AllocationId"]).to.eq(eventProperties.AllocationId);
            }
            if (eventProperties.FeatureFlagId) {
                expect(eventPropertiesToValidate["FeatureFlagId"]).to.eq(eventProperties.FeatureFlagId);
            }
            if (eventProperties.FeatureFlagReference) {
                const endpointMatch = connectionString.match(/Endpoint=([^;]+)/);
                if (endpointMatch) {
                    expect(eventPropertiesToValidate["FeatureFlagReference"]).to.eq(endpointMatch[1] + eventProperties.FeatureFlagReference);
                }
                else {
                    expect.fail("Connection string does not contain endpoint.");
                }
            }
            if (eventProperties.TargetingId) {
                expect(eventPropertiesToValidate["TargetingId"]).to.eq(eventProperties.TargetingId);
            }
        }
    }
}

describe("feature manager", function () {
    it("should pass NoFilters test", async () => {
        await runTest("NoFilters");
    });

    it("should pass RequirementType test", async () => {
        await runTest("RequirementType");
    });

    it("should pass RequirementType test", async () => {
        await runTest("RequirementType");
    });

    it("should pass TimeWindowFilter test", async () => {
        await runTest("TimeWindowFilter");
    });

    it("should pass TargetingFilter test", async () => {
        await runTest("TargetingFilter");
    });

    it("should pass TargetingFilter.modified test", async () => {
        await runTest("TargetingFilter.modified");
    });

    it("should pass BasicVariant test", async () => {
        await runTest("BasicVariant");
    });

    it("should pass VariantAssignment test", async () => {
        await runTest("VariantAssignment");
    });

    it("should pass ProviderTelemetry test", async () => {
        await runTestWithProvider("ProviderTelemetry");
    });

    it("should pass ProviderTelemetryComplete test", async () => {
        await runTestWithProvider("ProviderTelemetryComplete");
    });
});