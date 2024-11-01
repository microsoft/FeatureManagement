// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.validation_tests.models;

public class Variant {
    private String name;
    private Object configurationValue;

    /**
     * @return name
     * */
    public String getName() {
        return name;
    }

    /**
     * @param name the name of variant feature flag
     * */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return configurationValue
     * */
    public Object getConfigurationValue() {
        return configurationValue;
    }

    /**
     * @param configurationValue the configurationValue of the variant
     * */
    public void setConfigurationValue(Object exception) {
        this.configurationValue = exception;
    }
}
