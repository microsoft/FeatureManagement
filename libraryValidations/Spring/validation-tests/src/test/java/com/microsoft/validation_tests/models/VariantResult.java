// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.validation_tests.models;

public class VariantResult {
    private Variant result;
    private String exception;

    /**
     * @return result
     * */
    public Variant getResult() {
        return result;
    }

    /**
     * @param result the variant result of variant feature flag
     * */
    public void setResult(Variant result) {
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
