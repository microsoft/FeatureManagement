// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as sinon from "sinon";
import * as fs from "node:fs/promises";
import { FeatureManager, ConfigurationObjectFeatureFlagProvider } from "@microsoft/feature-management";
import { createTelemetryPublisher as createNodeTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-node";
import { createTelemetryPublisher as createBrowserTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-browser";
import { FILE_PATH, SAMPLE_JSON_KEY, TESTS_JSON_KEY, validateFeatureEvaluation, validateTelemetry, FeatureFlagTest} from "./utils.js";
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

async function runTestWithNodePackage(testName: string) {
    const config = JSON.parse(await fs.readFile(FILE_PATH + testName + SAMPLE_JSON_KEY, "utf8"));
    const testcases: FeatureFlagTest[] = JSON.parse(await fs.readFile(FILE_PATH + testName + TESTS_JSON_KEY, "utf8"));
    const ffProvider = new ConfigurationObjectFeatureFlagProvider(config);
    const fm = new FeatureManager(ffProvider, { onFeatureEvaluated: createNodeTelemetryPublisher(applicationInsights.defaultClient) });

    for (const testcase of testcases) {
        const featureFlagName = testcase.FeatureFlagName;
        const context = { userId: testcase.Inputs?.User, groups: testcase.Inputs?.Groups };
        await fm.getVariant(featureFlagName, context);
        validateTelemetry(testcase, undefined, eventNameToValidate, eventPropertiesToValidate);
        validateFeatureEvaluation(testcase, fm);
    }
}

async function runTestWithBrowserPackage(testName: string) {
    const config = JSON.parse(await fs.readFile(FILE_PATH + testName + SAMPLE_JSON_KEY, "utf8"));
    const testcases: FeatureFlagTest[] = JSON.parse(await fs.readFile(FILE_PATH + testName + TESTS_JSON_KEY, "utf8"));
    const ffProvider = new ConfigurationObjectFeatureFlagProvider(config);
    const fm = new FeatureManager(ffProvider, { onFeatureEvaluated: createBrowserTelemetryPublisher(appInsights) });

    for (const testcase of testcases) {
        const featureFlagName = testcase.FeatureFlagName;
        const context = { userId: testcase.Inputs?.User, groups: testcase.Inputs?.Groups };
        await fm.getVariant(featureFlagName, context);
        validateTelemetry(testcase, undefined, eventNameToValidate, eventPropertiesToValidate);
        validateFeatureEvaluation(testcase, fm);
    }
}

describe("telemetry with provider and node package", function () {
    it("should pass BasicTelemetry test", async () => {
        await runTestWithNodePackage("BasicTelemetry");
    });
});

describe("telemetry with provider and browser package", function () {
    it("should pass BasicTelemetry test", async () => {
        await runTestWithBrowserPackage("BasicTelemetry");
    });
});