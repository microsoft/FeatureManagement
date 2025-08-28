package com.microsoft.validation_tests.models;

import java.util.Map;

public class TelemetryResult {
    
    private String eventName;
    private Map<String, String> eventProperties;
    /**
     * @return the eventName
     */
    public String getEventName() {
        return eventName;
    }
    /**
     * @param eventName the eventName to set
     */
    public void setEventName(String eventName) {
        this.eventName = eventName;
    }
    /**
     * @return the eventProperties
     */
    public Map<String, String> getEventProperties() {
        return eventProperties;
    }
    /**
     * @param eventProperties the eventProperties to set
     */
    public void setEventProperties(Map<String, String> eventProperties) {
        this.eventProperties = eventProperties;
    }
    
}
