// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const expect = chai.expect;

import { FeatureManager } from "@microsoft/feature-management";

export const FILE_PATH = "../../Samples/"
export const SAMPLE_JSON_KEY = ".sample.json"
export const TESTS_JSON_KEY = ".tests.json"

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

export interface FeatureFlagTest {
    FeatureFlagName: string;
    Inputs?: IContext;
    IsEnabled?: IsEnabledResult;
    Variant?: GetVariantResult;
    Telemetry?: TelemetryResult;
    Description?: string; 
}

export async function validateFeatureEvaluation(testcase: FeatureFlagTest, featureManager: FeatureManager) {
    const featureFlagName = testcase.FeatureFlagName;
    const context = { userId: testcase.Inputs?.User, groups: testcase.Inputs?.Groups };

    if (testcase.IsEnabled) {
        if (testcase.IsEnabled.Exception !== undefined) {
            try {
                await featureManager.isEnabled(featureFlagName, context);
                expect.fail("It should throw exception.");
            } 
            catch (error) {
                // TODO: Verify the error message after we unify it across libraries
                // expect(error.message).to.include(testcase.IsEnabled.Exception);
            }
        } 
        else {
            expect(await featureManager.isEnabled(featureFlagName, context)).to.eq(testcase.IsEnabled.Result === "true");
        }
    }

    if (testcase.Variant){
        if (testcase.Variant.Exception !== undefined) {
            try {
                await featureManager.getVariant(featureFlagName, context);
                expect.fail("It should throw exception.");
            } 
            catch (error) {
                // TODO: Verify the error message after we unify it across libraries
                // expect(error.message).to.include(testcase.IsEnabled.Exception);
            }
        } 
        else {
            const variant = await featureManager.getVariant(featureFlagName, context);
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

export function validateTelemetryWithProvider(testcase: FeatureFlagTest, connectionString: string, eventNameToValidate: string, eventPropertiesToValidate: any) {
    // if (testcase.Telemetry?.EventName) {
    //     expect(eventNameToValidate).to.eq(testcase.Telemetry.EventName);
    // }

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