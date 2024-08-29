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

@TestPropertySource(locations = "file:./../../../Samples/TargetingFilter.sample - Copy.yml", factory = YamlPropertySourceFactory.class)
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = { SpringBootTest.class, Filters.class })
@EnableConfigurationProperties
@ComponentScan(basePackages = { "com.azure.spring.cloud.feature.management" })
@ActiveProfiles("TargetingFilter")
class TargetingFilterTests extends ValidationTestsApplicationTests {

    @Test
    void contextLoads() throws IOException {
        runTests("TargetingFilter");
    }

}
