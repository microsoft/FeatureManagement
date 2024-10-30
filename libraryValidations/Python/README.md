# Python Validation Tests

This directory contains a Python script that can be used to validate the correctness of the library against the files in the `Samples` directory.

## Prerequisites

* Python 3.7 or later

## Running the tests

To run the tests, execute the following command:

```bash
pip install -r requirements.txt
pytest test_json_validations.py
```

## Update to run more tests

To add more tests, after creating the required json files in the `Samples` directory, add a new test method in the `test_json_validations.py` file. The test method should be named as `test_<test_name>`. The test method needs to call the `runs_tests` method with the name of the test file as the argument.
