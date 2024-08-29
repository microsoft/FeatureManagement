package com.microsoft.validation_tests;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@TestPropertySource(locations = "file:./../../../Samples/TimeWindowFilter.sample.json", factory = YamlPropertySourceFactory.class)
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = { SpringBootTest.class, Filters.class })
@EnableConfigurationProperties
@ComponentScan(basePackages = { "com.azure.spring.cloud.feature.management" })
@ActiveProfiles("TimeWindowFilter")
class TimeWindowFilterTests extends ValidationTestsApplicationTests {

    @Test
    void contextLoads() throws IOException {
        runTests("TimeWindowFilter");
    }

}
