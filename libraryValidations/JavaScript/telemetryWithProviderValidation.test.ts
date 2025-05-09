// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as sinon from "sinon";
import * as fs from "node:fs/promises";
import { load } from "@azure/app-configuration-provider";
import { FeatureManager, ConfigurationMapFeatureFlagProvider } from "@microsoft/feature-management";
import { createTelemetryPublisher as createNodeTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-node";
import { createTelemetryPublisher as createBrowserTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-browser";
import { FILE_PATH, TESTS_JSON_KEY, FeatureFlagTest, validateFeatureEvaluation, validateTelemetry } from "./utils.js";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import applicationInsights from "applicationinsights";

// For telemetry validation
let eventNameToValidate;
let eventPropertiesToValidate;

applicationInsights.setup("DUMMY-CONNECTION-STRING").start();
sinon.stub(applicationInsights.defaultClient, "trackEvent").callsFake((event) => {
    eventNameToValidate = event.name;
    eventPropertiesToValidate = event.properties;
});

const appInsights = new ApplicationInsights({ config: { connectionString: "DUMMY-CONNECTION-STRING" }});
sinon.stub(appInsights, "trackEvent").callsFake((event, customProperties) => {
    eventNameToValidate = event.name;
    eventPropertiesToValidate = customProperties;
});

async function runTestWithProviderAndNodePackage(testName: string) {
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
    const fm = new FeatureManager(ffProvider, { onFeatureEvaluated: createNodeTelemetryPublisher(applicationInsights.defaultClient) });
    for (const testcase of testcases) {
        const featureFlagName = testcase.FeatureFlagName;
        const context = { userId: testcase.Inputs?.User, groups: testcase.Inputs?.Groups };
        await fm.getVariant(featureFlagName, context);
        validateTelemetry(testcase, connectionString, eventNameToValidate, eventPropertiesToValidate);
        validateFeatureEvaluation(testcase, fm);
    }
}

async function runTestWithProviderAndBrowserPackage(testName: string) {
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
    const fm = new FeatureManager(ffProvider, { onFeatureEvaluated: createBrowserTelemetryPublisher(appInsights) });
    for (const testcase of testcases) {
        const featureFlagName = testcase.FeatureFlagName;
        const context = { userId: testcase.Inputs?.User, groups: testcase.Inputs?.Groups };
        await fm.getVariant(featureFlagName, context);
        validateTelemetry(testcase, connectionString, eventNameToValidate, eventPropertiesToValidate);
        validateFeatureEvaluation(testcase, fm);
    }
}

describe("telemetry with provider and node package", function () {
    it("should pass ProviderTelemetry test", async () => {
        await runTestWithProviderAndNodePackage("ProviderTelemetry");
    });

    it("should pass ProviderTelemetryComplete test", async () => {
        await runTestWithProviderAndNodePackage("ProviderTelemetryComplete");
    });
});

describe("telemetry with provider and browser package", function () {
    it("should pass ProviderTelemetry test", async () => {
        await runTestWithProviderAndBrowserPackage("ProviderTelemetry");
    });

    it("should pass ProviderTelemetryComplete test", async () => {
        await runTestWithProviderAndBrowserPackage("ProviderTelemetryComplete");
    });
});