package com.microsoft.validation_tests;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.util.Iterator;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import com.azure.spring.cloud.feature.management.telemetry.LoggerTelemetryPublisher;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.Appender;
import ch.qos.logback.core.read.ListAppender;

@SpringJUnitConfig
@TestPropertySource(locations = "file:./../../../Samples/BasicTelemetry.sample.json", factory = YamlPropertySourceFactory.class)
@SpringBootTest(classes = { SpringBootTest.class, Filters.class })
@EnableConfigurationProperties
@ComponentScan(basePackages = { "com.azure.spring.cloud.feature.management" })
class BasicTelemetryTests extends ValidationTestsApplicationTests { 

    private Logger publisherLogger;

    private ListAppender<ILoggingEvent> listAppender;
    
    @BeforeAll
    public static void setUpLogging() {
        // Force SLF4J to initialize
        LoggerFactory.getLogger(BasicTelemetryTests.class).info("Initializing SLF4J in test");
    }


    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        org.slf4j.Logger slf4jLogger = LoggerFactory.getLogger(LoggerTelemetryPublisher.class);

        // Check if we can cast to Logback's Logger
        if (slf4jLogger instanceof ch.qos.logback.classic.Logger) {
            publisherLogger = (ch.qos.logback.classic.Logger) slf4jLogger;
            
            // Create a new ListAppender for each test
            listAppender = new ListAppender<>();
            listAppender.start();
            
            // Remove any existing appenders of this type first
            for (Iterator<Appender<ILoggingEvent>> it = publisherLogger.iteratorForAppenders(); it.hasNext();) {
                Appender<ILoggingEvent> appender = it.next();
                if (appender instanceof ListAppender) {
                    publisherLogger.detachAppender(appender);
                }
            }
            
            // Add the fresh appender
            publisherLogger.addAppender(listAppender);
        } else {
            assumeTrue(
                false,
                "Tests require Logback implementation, but found: " + slf4jLogger.getClass().getName()
            );
        }
    }
    
    @Test
    void validateTest() throws IOException {
        runTests("BasicTelemetry", listAppender);
    }

}
