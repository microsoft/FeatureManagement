package com.microsoft.validation_tests;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

@SpringJUnitConfig
@TestPropertySource(locations = "file:./../../../Samples/NoFilters.sample.json", factory = YamlPropertySourceFactory.class)
@SpringBootTest(classes = { SpringBootTest.class, Filters.class })
@EnableConfigurationProperties
@ComponentScan(basePackages = { "com.azure.spring.cloud.feature.management" })
@ActiveProfiles("override")
class NoFiltersTests extends ValidationTestsApplicationTests {  
    
    @Test
    void validateTest() throws IOException {
        runTests("NoFilters");
    }

}
