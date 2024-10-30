// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from "node:fs/promises";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
import { FeatureManager, ConfigurationObjectFeatureFlagProvider } from "@microsoft/feature-management";
const expect = chai.expect;

const FILE_PATH = "../../Samples/"
const SAMPLE_JSON_KEY = ".sample.json"
const TESTS_JSON_KEY = ".tests.json"

interface IContext {
    user?: string;
    groups?: string[];
}

interface IsEnabledResult {
    Result?: string;
    Exception?: string;
}

interface FeatureFlagTest {
    FeatureFlagName: string;
    Inputs?: IContext;
    IsEnabled?: IsEnabledResult;
    Description?: string; 
}

async function runTest(testName: string) {
    const config = JSON.parse(await fs.readFile(FILE_PATH + testName + SAMPLE_JSON_KEY, "utf8"));
    const testcases: FeatureFlagTest[] = JSON.parse(await fs.readFile(FILE_PATH + testName + TESTS_JSON_KEY, "utf8"));
    const ffProvider = new ConfigurationObjectFeatureFlagProvider(config);
    const fm = new FeatureManager(ffProvider);

    for (const testcase of testcases){
        const featureFlagName = testcase.FeatureFlagName;
        const context = { userId: testcase.Inputs?.user, groups: testcase.Inputs?.groups };

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

});