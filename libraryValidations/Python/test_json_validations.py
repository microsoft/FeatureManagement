# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import json
import unittest
from pytest import raises
from featuremanagement import FeatureManager, TargetingContext
from featuremanagement.azuremonitor import publish_telemetry
from unittest.mock import patch, call

FILE_PATH = "../../Samples/"
SAMPLE_JSON_KEY = ".sample.json"
TESTS_JSON_KEY = ".tests.json"
FRIENDLY_NAME_KEY = "FriendlyName"
IS_ENABLED_KEY = "IsEnabled"
GET_VARIANT_KEY = "Variant"
GET_TELEMETRY_KEY = "Telemetry"
EVENT_NAME_KEY = "EventName"
EVENT_PROPERTIES_KEY = "EventProperties"
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


class TestFromFile(unittest.TestCase):

    def test_no_filters(self):
        test_key = "NoFilters"
        self.run_tests(test_key)

    def test_time_window_filter(self):
        test_key = "TimeWindowFilter"
        self.run_tests(test_key)

    def test_targeting_filter(self):
        test_key = "TargetingFilter"
        self.run_tests(test_key)

    def test_targeting_filter_modified(self):
        test_key = "TargetingFilter.modified"
        self.run_tests(test_key)

    def test_requirement_type(self):
        test_key = "RequirementType"
        self.run_tests(test_key)

    def test_basic_variant(self):
        test_key = "BasicVariant"
        self.run_tests(test_key)

    def test_variant_assignment(self):
        test_key = "VariantAssignment"
        self.run_tests(test_key)

    @patch("featuremanagement.azuremonitor._send_telemetry.azure_monitor_track_event")
    def test_basic_telemetry(self, track_event_mock):
        test_key = "BasicTelemetry"
        self._ran_callback = False
        self._mock_track_event = track_event_mock
        self.run_tests(test_key, telemetry_callback=self.telemetry_callback)
        assert self._ran_callback

    @staticmethod
    def load_from_file(file, telemetry_callback=None):
        with open(FILE_PATH + file, "r", encoding="utf-8") as feature_flags_file:
            feature_flags = json.load(feature_flags_file)

        feature_manager = FeatureManager(
            feature_flags, on_feature_evaluated=telemetry_callback
        )
        assert feature_manager is not None

        return feature_manager

    def telemetry_callback(self, evaluation_event):
        publish_telemetry(evaluation_event)
        expected_telemetry = self._feature_flag_test.get(GET_TELEMETRY_KEY, {})
        self._mock_track_event.assert_called_once()
        self.assertEqual(self._mock_track_event.call_args[0][0], expected_telemetry.get(EVENT_NAME_KEY, None))
        (event_properties) = self._mock_track_event.call_args[0][1]
        self.assertEqual(sorted(event_properties), sorted(expected_telemetry.get(EVENT_PROPERTIES_KEY, {})))
        self._ran_callback = True
        self._mock_track_event.reset_mock()

    def run_tests(self, test_key, telemetry_callback=None):
        feature_manager = self.load_from_file(
            test_key + SAMPLE_JSON_KEY, telemetry_callback=telemetry_callback
        )

        with open(
            FILE_PATH + test_key + TESTS_JSON_KEY, "r", encoding="utf-8"
        ) as feature_flag_test_file:
            feature_flag_tests = json.load(feature_flag_test_file)

        for feature_flag_test in feature_flag_tests:
            self._feature_flag_test = feature_flag_test
            is_enabled = feature_flag_test[IS_ENABLED_KEY]
            get_variant = feature_flag_test.get(GET_VARIANT_KEY, None)
            expected_is_enabled_result = convert_boolean_value(
                is_enabled.get(RESULT_KEY)
            )
            feature_flag_id = test_key + "." + feature_flag_test[FEATURE_FLAG_NAME_KEY]

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
