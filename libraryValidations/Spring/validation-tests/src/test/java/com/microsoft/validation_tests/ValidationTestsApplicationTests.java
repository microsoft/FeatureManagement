package com.microsoft.validation_tests;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.LinkedHashMap;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.azure.spring.cloud.feature.management.FeatureManager;
import com.azure.spring.cloud.feature.management.models.Variant;
import com.azure.spring.cloud.feature.management.validation_tests.models.ValidationTestCase;
import com.azure.spring.cloud.feature.management.validation_tests.models.VariantResult;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.fasterxml.jackson.databind.type.TypeFactory;

class ValidationTestsApplicationTests {

    private static final Logger LOGGER = LoggerFactory.getLogger(ValidationTestsApplicationTests.class);

    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder()
        .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true).build();

    private static final String PATH = "./../../../Samples/";

    static final String TEST_FILE_POSTFIX = ".tests.json";

    private final String inputsUser = "User";

    private final String inputsGroups = "Groups";

    @Autowired
    private FeatureManager featureManager;
    @Autowired
    private TargetingFilterTestContextAccessor accessor;

    void runTests(String name) throws IOException {
        LOGGER.debug("Running test case from file: " + name);
        final File testsFile = new File(PATH + name + TEST_FILE_POSTFIX);
        List<ValidationTestCase> testCases = readTestcasesFromFile(testsFile);
        for (ValidationTestCase testCase : testCases) {
            LOGGER.debug("Test case : " + testCase.getDescription());
            if (hasException(testCase)) { // TODO(mametcal). Currently we didn't throw the exception when parameter is
                                          // invalid
                // assertNull(managementProperties.getOnOff().get(testCase.getFeatureFlagName()));
                continue;
            }
            if (hasInput(testCase)) { // Set inputs
                final Object userObj = testCase.getInputs().get(inputsUser);
                final Object groupsObj = testCase.getInputs().get(inputsGroups);
                final String user = userObj != null ? userObj.toString() : null;
                @SuppressWarnings("unchecked")
                final List<String> groups = groupsObj != null ? (List<String>) groupsObj : null;
                accessor.setUser(user).setGroups(groups);
            }

            final Boolean result = featureManager.isEnabled(testCase.getFeatureFlagName());
            assertEquals(testCase.getIsEnabled().getResult(), result.toString(), testCase.getFriendlyName());

            VariantResult variantResult = testCase.getVariant();

            if (variantResult != null && variantResult.getResult() != null && testCase.getVariant() != null) {
                final Variant getVariantResult = featureManager.getVariant(testCase.getFeatureFlagName());
                if (variantResult.getResult().getName() != null) {
                    assertEquals(variantResult.getResult().getName(), getVariantResult.getName());
                }
                assertEquals(variantResult.getResult().getConfigurationValue(), getVariantResult.getValue());

            }

        }
    }

    private boolean hasException(ValidationTestCase testCase) {
        final String exceptionStr = testCase.getIsEnabled().getException();
        return exceptionStr != null && !exceptionStr.isEmpty();
    }

    private boolean hasInput(ValidationTestCase testCase) {
        final LinkedHashMap<String, Object> inputsMap = testCase.getInputs();
        return inputsMap != null && !inputsMap.isEmpty();
    }

    private List<ValidationTestCase> readTestcasesFromFile(File testFile) throws IOException {
        final String jsonString = Files.readString(testFile.toPath());
        final CollectionType typeReference = TypeFactory.defaultInstance().constructCollectionType(List.class,
            ValidationTestCase.class);
        return OBJECT_MAPPER.readValue(jsonString, typeReference);
    }

}
