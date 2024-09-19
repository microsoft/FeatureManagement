// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.validation_tests;

import com.azure.spring.cloud.feature.management.targeting.TargetingContext;
import com.azure.spring.cloud.feature.management.targeting.TargetingContextAccessor;

import java.util.List;

public class TargetingFilterTestContextAccessor implements TargetingContextAccessor {

    private String user;

    private List<String> groups;

    public String getUser() {
        return user;
    }

    public TargetingFilterTestContextAccessor setUser(String user) {
        this.user = user;
        return this;
    }

    public List<String> getGroups() {
        return groups;
    }

    public TargetingFilterTestContextAccessor setGroups(List<String> groups) {
        this.groups = groups;
        return this;
    }

    @Override
    public void configureTargetingContext(TargetingContext context) {
        context.setUserId(user);
        context.setGroups(groups);
    }

}
