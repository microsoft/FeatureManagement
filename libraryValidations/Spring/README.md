# Spring Validation Tests

This directory contains a Spring Boot application that can be used to validate the correctness of the library against the files in the `Samples` directory.

## Prerequisites

* Java 8 or later
* Maven

## Running the tests

To run the tests, execute the following command:

```bash
mvn test
```

## Update to run more tests

To add more tests, after creating the required json files in the `Samples` directory, add a new test class in the `src\test\java\com\microsoft\validation_tests` folder. The test file should be named as `<test_name>Tests.java`. And should use the bellow template.

```java
import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

@SpringJUnitConfig
@TestPropertySource(locations = "file:./../../../Samples/<test_name>.sample.json", factory = YamlPropertySourceFactory.class)
@SpringBootTest(classes = { SpringBootTest.class, Filters.class })
@EnableConfigurationProperties
@ComponentScan(basePackages = { "com.azure.spring.cloud.feature.management" })
@ActiveProfiles("override")
class TestNameTests extends ValidationTestsApplicationTests {  
    
    @Test
    void validateTest() throws IOException {
        runTests("TestName");
    }

}

```
