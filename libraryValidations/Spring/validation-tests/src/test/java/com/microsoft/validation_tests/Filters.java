package com.microsoft.validation_tests;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.azure.spring.cloud.feature.management.filters.TargetingFilter;
import com.azure.spring.cloud.feature.management.filters.TimeWindowFilter;

@Configuration
public class Filters {
    
    @Bean(name="Microsoft.TimeWindow")
    public TimeWindowFilter timeWindowFilter() {
        return new TimeWindowFilter();
    }
    
    @Bean(name="Microsoft.Targeting")
    public TargetingFilter targetingFilter(TargetingFilterTestContextAccessor accessor) {
        return new TargetingFilter(accessor);
    }
    
    @Bean
    public TargetingFilterTestContextAccessor accessor() {
        return new TargetingFilterTestContextAccessor();
    }

}
