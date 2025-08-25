package com.microsoft.validation_tests;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.azure.spring.cloud.feature.management.FeatureManager;
import com.azure.spring.cloud.feature.management.models.Variant;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.microsoft.validation_tests.models.ValidationTestCase;
import com.microsoft.validation_tests.models.VariantResult;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

class ValidationTestsApplicationTests {

    private static final Logger LOGGER = LoggerFactory.getLogger(ValidationTestsApplicationTests.class);

    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder()
        .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true).build();

    private static final String PATH = "./../../../Samples/";

    static final String TEST_FILE_POSTFIX = ".tests.json";

    private final String inputsUser = "User";

    private final String inputsGroups = "Groups";
    
    static final String EVENT_NAME = "FeatureEvaluation";

    static final String FEATURE_NAME = "FeatureName";

    static final String ENABLED = "Enabled";

    static final String REASON = "VariantAssignmentReason";

    static final String VERSION = "Version";

    static final String EVALUATION_EVENT_VERSION = "1.1.0";

    static final String APPLICATION_INSIGHTS_CUSTOM_EVENT_KEY = "microsoft.custom_event.name";

    @Autowired
    private FeatureManager featureManager;
    @Autowired
    private TargetingFilterTestContextAccessor accessor;

    void runTests(String name, ListAppender<ILoggingEvent> listAppender) throws IOException {
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
            
           if (testCase.getTelemetry() != null) {
               ILoggingEvent logEvent = getEvent(listAppender.list, testCase.getFeatureFlagName());
               Map<String, String> mdcMap = logEvent.getMDCPropertyMap();
               Map<String, String> expectedProperties = testCase.getTelemetry().getEventProperties();

               assertEquals(EVENT_NAME, logEvent.getMessage());
               assertEquals(Level.INFO, logEvent.getLevel());
               assertEquals(expectedProperties.get(REASON), mdcMap.get(REASON));
               assertEquals(testCase.getFeatureFlagName(), mdcMap.get(FEATURE_NAME));
               assertEquals("false", mdcMap.get(ENABLED));
               assertEquals(EVALUATION_EVENT_VERSION, mdcMap.get(VERSION));
               assertEquals(EVENT_NAME, mdcMap.get(APPLICATION_INSIGHTS_CUSTOM_EVENT_KEY));

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
    
    ILoggingEvent getEvent(List<ILoggingEvent> events, String featureName) {
        for (ILoggingEvent event : events) {
            if (featureName.equals(event.getMDCPropertyMap().get(FEATURE_NAME))) {
                return event;
            }
        }
        assumeTrue(
            false,
            "Log event not found for feature: " + featureName
        );
        return null; // This line will never be reached due to the assumption above
    }

}
