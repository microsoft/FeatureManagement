// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from "node:fs/promises";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
import { load } from "@azure/app-configuration-provider";
import { FeatureManager, ConfigurationObjectFeatureFlagProvider, ConfigurationMapFeatureFlagProvider, createFeatureEvaluationEventProperties, EvaluationResult } from "@microsoft/feature-management";
const expect = chai.expect;

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
    if (connectionString !== undefined) {
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

        // For telemetry validation
        let propertiesToValidate;
        const validateTelemetry = (result: EvaluationResult) => {
            propertiesToValidate = createFeatureEvaluationEventProperties(result);
        };

        const fm = new FeatureManager(ffProvider, { onFeatureEvaluated: validateTelemetry });

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

            const eventProperties = testcase.Telemetry?.EventProperties;
            if (eventProperties) {
                if (eventProperties.AllocationId) {
                    expect(propertiesToValidate["AllocationId"]).to.eq(eventProperties.AllocationId);
                }
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
});