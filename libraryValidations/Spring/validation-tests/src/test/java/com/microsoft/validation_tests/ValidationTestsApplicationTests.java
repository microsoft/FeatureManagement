package com.microsoft.validation_tests;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.LinkedHashMap;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import com.azure.spring.cloud.feature.management.FeatureManager;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.microsoft.validation_tests.models.ValidationTestCase;

//@TestPropertySource(locations = "file:./../../../Samples/NoFilters.sample.json")
@TestPropertySource(locations = "/config/application.yml")
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = { SpringBootTest.class })
@EnableConfigurationProperties
//@EnableAutoConfiguration
@ComponentScan(basePackages = { "com.azure.spring.cloud.feature.management" })
@ActiveProfiles("override")
class ValidationTestsApplicationTests {

    private static final Logger LOGGER = LoggerFactory.getLogger(ValidationTestsApplicationTests.class);

    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder()
        .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true).build();
    
    private static final String PATH = "./../../../Samples/";

    private static final String NAME = "NoFilters";

    private static final String SOURCE = NAME + ".sample.json";
    
    static final String TEST_FILE_NAME = NAME + ".tests.json";

    private final String inputsUser = "user";

    private final String inputsGroups = "groups";

    @Autowired
    private FeatureManager featureManager;

    @Test
    void contextLoads() throws IOException {
        LOGGER.info("Running test case from file: " + NAME);
        final File testsFile = new File(PATH + TEST_FILE_NAME);
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
                // when(context.getBean(Mockito.contains("Targeting")))
                // .thenReturn(new TargetingFilter(new TargetingFilterTestContextAccessor(user, groups)));
            }

            final Boolean result = featureManager.isEnabled(testCase.getFeatureFlagName());
            LOGGER.info(testCase.getFeatureFlagName());
            assertEquals(result.toString(), testCase.getIsEnabled().getResult(), testCase.getFriendlyName());
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
