# .NET Validation Tests

This directory contains a .NET script that can be used to validate the correctness of the library against the files in the `Samples` directory.

## Prerequisites

* .NET 9 or later

## Running the tests

To run the tests, execute the following command:

```bash
dotnet test
```

## Update to run more tests

To add more tests, after creating the required json files in the `Samples` directory, add a new test method in the `TestValidations.cs` file.
