// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.validation_tests.models;

public class Variant {
    private String result;
    private String exception;

    /**
     * @return result
     * */
    public String getResult() {
        return result;
    }

    /**
     * @param result the result of variant feature flag
     * */
    public void setResult(String result) {
        this.result = result;
    }

    /**
     * @return exception
     * */
    public String getException() {
        return exception;
    }

    /**
     * @param exception the exception message throws when run variant test case
     * */
    public void setException(String exception) {
        this.exception = exception;
    }
}
