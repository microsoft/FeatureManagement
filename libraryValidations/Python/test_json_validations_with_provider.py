# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

from unittest.mock import patch
import json
import unittest
import os
from pytest import raises
from azure.appconfiguration.provider import load
from featuremanagement import FeatureManager, TargetingContext
from featuremanagement.azuremonitor import publish_telemetry

FILE_PATH = "../../Samples/"
SAMPLE_JSON_KEY = ".sample.json"
TESTS_JSON_KEY = ".tests.json"
FRIENDLY_NAME_KEY = "FriendlyName"
IS_ENABLED_KEY = "IsEnabled"
GET_VARIANT_KEY = "Variant"
RESULT_KEY = "Result"
VARIANT_NAME_KEY = "Name"
CONFIGURATION_VALUE_KEY = "ConfigurationValue"
FEATURE_FLAG_NAME_KEY = "FeatureFlagName"
INPUTS_KEY = "Inputs"
USER_KEY = "User"
GROUPS_KEY = "Groups"
EXCEPTION_KEY = "Exception"
DESCRIPTION_KEY = "Description"


def convert_boolean_value(enabled):
    if enabled is None:
        return None
    if isinstance(enabled, bool):
        return enabled
    if enabled.lower() == "true":
        return True
    if enabled.lower() == "false":
        return False
    return enabled


class TestFromProvider(unittest.TestCase):

    def test_provider_telemetry(self):
        test_key = "ProviderTelemetry"
        with patch(
            "featuremanagement.azuremonitor._send_telemetry.azure_monitor_track_event"
        ) as mock_track_event:
            self.run_tests(test_key, mock_track_event)

    def test_complete_provider_telemetry(self):
        test_key = "ProviderTelemetryComplete"
        with patch(
            "featuremanagement.azuremonitor._send_telemetry.azure_monitor_track_event"
        ) as mock_track_event:
            self.run_tests(test_key, mock_track_event)

    @staticmethod
    def load_from_provider():
        connection_string = os.getenv("APP_CONFIG_VALIDATION_CONNECTION_STRING")
        config = load(
            connection_string=connection_string, selects=[], feature_flag_enabled=True
        )

        feature_manager = FeatureManager(config, on_feature_evaluated=publish_telemetry)
        assert feature_manager is not None

        return feature_manager

    def run_tests(self, test_key, track_event_mock):
        feature_manager = self.load_from_provider()

        with open(
            FILE_PATH + test_key + TESTS_JSON_KEY, "r", encoding="utf-8"
        ) as feature_flag_test_file:
            feature_flag_tests = json.load(feature_flag_test_file)

        for feature_flag_test in feature_flag_tests:
            track_event_mock.reset_mock()
            is_enabled = feature_flag_test[IS_ENABLED_KEY]
            get_variant = feature_flag_test.get(GET_VARIANT_KEY, None)
            expected_is_enabled_result = convert_boolean_value(
                is_enabled.get(RESULT_KEY)
            )
            feature_flag_id = test_key + "." + feature_flag_test[FEATURE_FLAG_NAME_KEY]
            telemetry = feature_flag_test.get("Telemetry", None)

            failed_description = f"Test {feature_flag_id} failed. Description: {feature_flag_test[DESCRIPTION_KEY]}"

            if isinstance(expected_is_enabled_result, bool):
                user = feature_flag_test[INPUTS_KEY].get(USER_KEY, None)
                groups = feature_flag_test[INPUTS_KEY].get(GROUPS_KEY, [])
                assert (
                    feature_manager.is_enabled(
                        feature_flag_test[FEATURE_FLAG_NAME_KEY],
                        TargetingContext(user_id=user, groups=groups),
                    )
                    == expected_is_enabled_result
                ), failed_description
            else:
                with raises(ValueError) as ex_info:
                    feature_manager.is_enabled(
                        feature_flag_test[FEATURE_FLAG_NAME_KEY],
                        TargetingContext(user_id=user, groups=groups),
                    )
                expected_message = is_enabled.get(EXCEPTION_KEY)
                assert str(ex_info.value) == expected_message, failed_description

            if get_variant:
                user = feature_flag_test[INPUTS_KEY].get(USER_KEY, None)
                groups = feature_flag_test[INPUTS_KEY].get(GROUPS_KEY, [])

                if RESULT_KEY not in get_variant:
                    with raises(ValueError) as ex_info:
                        feature_manager.get_variant(
                            feature_flag_test[FEATURE_FLAG_NAME_KEY],
                            TargetingContext(user_id=user, groups=groups),
                        )
                    expected_message = get_variant.get(EXCEPTION_KEY)
                    assert str(ex_info.value) == expected_message, failed_description
                    continue

                variant = feature_manager.get_variant(
                    feature_flag_test[FEATURE_FLAG_NAME_KEY],
                    TargetingContext(user_id=user, groups=groups),
                )
                if not get_variant[RESULT_KEY]:
                    assert not variant
                    continue
                if VARIANT_NAME_KEY in get_variant[RESULT_KEY]:
                    assert (
                        variant.name == get_variant[RESULT_KEY][VARIANT_NAME_KEY]
                    ), failed_description

                assert (
                    variant.configuration
                    == get_variant[RESULT_KEY][CONFIGURATION_VALUE_KEY]
                ), failed_description

                if telemetry:
                    assert track_event_mock.called
                    assert track_event_mock.call_count == 2
                    assert track_event_mock.call_args[0][0] == telemetry["EventName"]

                    event = track_event_mock.call_args[0][1]
                    event_properties = telemetry["EventProperties"]
                    connection_string = os.getenv(
                        "APP_CONFIG_VALIDATION_CONNECTION_STRING"
                    )
                    endpoint = endpoint_from_connection_string(connection_string)

                    assert event["FeatureName"] == event_properties["FeatureName"]
                    assert event["Enabled"] == event_properties["Enabled"]
                    assert event["Version"] == event_properties["Version"]
                    assert event["Variant"] == event_properties["Variant"]
                    assert (
                        event["VariantAssignmentReason"]
                        == event_properties["VariantAssignmentReason"]
                    )

                    if (
                        "VariantAssignmentPercentage" in event
                    ):  # User/Group assignment doesn't have this property
                        assert (
                            event["VariantAssignmentPercentage"]
                            == event_properties["VariantAssignmentPercentage"]
                        )

                    assert (
                        event["DefaultWhenEnabled"]
                        == event_properties["DefaultWhenEnabled"]
                    )
                    assert event[
                        "ETag"
                    ]  # ETag will be different for each store, just assert it exists
                    assert (
                        event["FeatureFlagReference"]
                        == endpoint + event_properties["FeatureFlagReference"]
                    )
                    assert (
                        event["FeatureFlagId"].decode("utf-8")
                        == event_properties["FeatureFlagId"]
                    )
                    assert event["AllocationId"] == event_properties["AllocationId"]
                    assert event["TargetingId"] == event_properties["TargetingId"]


def endpoint_from_connection_string(connection_string):
    return connection_string.split("Endpoint=")[1].split(";")[0]
