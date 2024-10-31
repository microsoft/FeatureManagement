# Navigate to the Dotnet directory and run dotnet test
Set-Location -Path "./Dotnet"
dotnet test

# Navigate to the Python directory and run pytest
Set-Location -Path "../Python"
python -m venv venv
.\venv\Scripts\activate.ps1
pip install -r requirements.txt
pytest test_json_validations.py
deactivate

# Navigate to the Spring directory and run mvn test
Set-Location -Path "../Spring/validation-tests"
mvn test

Set-Location -Path ".."