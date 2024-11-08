// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from "node:fs/promises";
import { FeatureManager, ConfigurationObjectFeatureFlagProvider } from "@microsoft/feature-management";
import {FILE_PATH, SAMPLE_JSON_KEY, TESTS_JSON_KEY, validateFeatureEvaluation, FeatureFlagTest } from "./utils.js";

async function runTest(testName: string) {
    const config = JSON.parse(await fs.readFile(FILE_PATH + testName + SAMPLE_JSON_KEY, "utf8"));
    const testcases: FeatureFlagTest[] = JSON.parse(await fs.readFile(FILE_PATH + testName + TESTS_JSON_KEY, "utf8"));
    const ffProvider = new ConfigurationObjectFeatureFlagProvider(config);
    const fm = new FeatureManager(ffProvider);

    for (const testcase of testcases){
        validateFeatureEvaluation(testcase, fm);
    }
}

describe("feature evaluation validation", function () {
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
});
