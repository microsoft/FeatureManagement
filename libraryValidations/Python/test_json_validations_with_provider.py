# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from unittest.mock import patch
import logging
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
FEATURE_FLAG_NAME_KEY = "FeatureFlagName"
INPUTS_KEY = "Inputs"
USER_KEY = "user"
GROUPS_KEY = "groups"
EXCEPTION_KEY = "Exception"
DESCRIPTION_KEY = "Description"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
    # method: is_enabled
    def test_no_filters(self):
        test_key = "ProviderTelemetry"
        with patch("featuremanagement.azuremonitor._send_telemetry.azure_monitor_track_event") as mock_track_event:
            self.run_tests(test_key, mock_track_event)

    @staticmethod
    def load_from_provider():
        connection_string = os.getenv("APP_CONFIG_VALIDATION_CONNECTION_STRING")
        config = load(connection_string=connection_string, selects=[], feature_flag_enabled=True)

        feature_manager = FeatureManager(config, on_feature_evaluated=publish_telemetry)
        assert feature_manager is not None

        return feature_manager

    # method: is_enabled
    def run_tests(self, test_key, track_event_mock):
        feature_manager = self.load_from_provider()

        with open(FILE_PATH + test_key + TESTS_JSON_KEY, "r", encoding="utf-8") as feature_flag_test_file:
            feature_flag_tests = json.load(feature_flag_test_file)

        for feature_flag_test in feature_flag_tests:
            is_enabled = feature_flag_test[IS_ENABLED_KEY]
            get_variant = feature_flag_test.get(GET_VARIANT_KEY, None)
            expected_is_enabled_result = convert_boolean_value(is_enabled.get(RESULT_KEY))
            feature_flag_id = test_key + "." + feature_flag_test[FEATURE_FLAG_NAME_KEY]
            telemetry = feature_flag_test.get("Telemetry", None)

            failed_description = f"Test {feature_flag_id} failed. Description: {feature_flag_test[DESCRIPTION_KEY]}"

            if isinstance(expected_is_enabled_result, bool):
                user = feature_flag_test[INPUTS_KEY].get(USER_KEY, None)
                groups = feature_flag_test[INPUTS_KEY].get(GROUPS_KEY, [])
                assert (
                    feature_manager.is_enabled(
                        feature_flag_test[FEATURE_FLAG_NAME_KEY], TargetingContext(user_id=user, groups=groups)
                    )
                    == expected_is_enabled_result
                ), failed_description
            else:
                with raises(ValueError) as ex_info:
                    feature_manager.is_enabled(feature_flag_test[FEATURE_FLAG_NAME_KEY])
                expected_message = is_enabled.get(EXCEPTION_KEY)
                assert str(ex_info.value) == expected_message, failed_description

            if get_variant is not None and get_variant[RESULT_KEY]:
                user = feature_flag_test[INPUTS_KEY].get(USER_KEY, None)
                groups = feature_flag_test[INPUTS_KEY].get(GROUPS_KEY, [])
                variant = feature_manager.get_variant(feature_flag_test[FEATURE_FLAG_NAME_KEY], TargetingContext(user_id=user, groups=groups))
                if not variant:
                    logger.error(f"Variant is None for {feature_flag_id}")
                    assert False, failed_description
                assert variant.configuration == get_variant[RESULT_KEY], failed_description

                if telemetry:
                    assert track_event_mock.called
                    assert track_event_mock.call_count == 2
                    assert track_event_mock.call_args[0][0] == telemetry["event_name"]
                    assert track_event_mock.call_args[0][1]["FeatureName"] == telemetry["event_properties"]["FeatureName"]
                    assert track_event_mock.call_args[0][1]["Enabled"] == telemetry["event_properties"]["Enabled"]
                    assert track_event_mock.call_args[0][1]["Version"] == telemetry["event_properties"]["Version"]
                    assert track_event_mock.call_args[0][1]["Variant"] == telemetry["event_properties"]["Variant"]
                    assert track_event_mock.call_args[0][1]["VariantAssignmentReason"] == telemetry["event_properties"]["VariantAssignmentReason"]
                    assert track_event_mock.call_args[0][1]["VariantAssignmentPercentage"] == telemetry["event_properties"]["VariantAssignmentPercentage"]
                    assert track_event_mock.call_args[0][1]["DefaultWhenEnabled"] == telemetry["event_properties"]["DefaultWhenEnabled"]
                    assert track_event_mock.call_args[0][1]["ETag"] == telemetry["event_properties"]["ETag"]
                    connection_string = os.getenv("APP_CONFIG_VALIDATION_CONNECTION_STRING")
                    endpoint = endpoint_from_connection_string(connection_string)
                    assert track_event_mock.call_args[0][1]["FeatureFlagReference"] ==  endpoint + telemetry["event_properties"]["FeatureFlagReference"]
                    assert track_event_mock.call_args[0][1]["FeatureFlagId"].decode("utf-8") == telemetry["event_properties"]["FeatureFlagId"]
                    assert track_event_mock.call_args[0][1]["AllocationId"] == telemetry["event_properties"]["AllocationId"]
                    assert track_event_mock.call_args[0][1]["TargetingId"] == telemetry["event_properties"]["TargetingId"]


def endpoint_from_connection_string(connection_string):
    return connection_string.split("Endpoint=")[1].split(";")[0]