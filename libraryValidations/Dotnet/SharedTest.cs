using System.Text.Json;
using System.Text.Json.Serialization;

namespace Dotnet
{
    internal class SharedTest
    {
        public required string FeatureFlagName { get; set; }
        public InputsSection? Inputs { get; set; }
        public IsEnabledSection? IsEnabled { get; set; }
        public VariantSection? Variant { get; set; }
        public TelemetrySection? Telemetry { get; set; }
        public string? Description { get; set; }


        internal class InputsSection
        {
            public string? User { get; set; }
            public string[]? Groups { get; set; }
        }

        internal class IsEnabledSection
        {
            public string? Result { get; set; }
            public string? Exception { get; set; }
        }

        internal class VariantSection
        {
            public VariantResultSection? Result { get; set; }
            public string? Exception { get; set; }
        }

        internal class VariantResultSection
        {
            public JsonElement? ConfigurationValue { get; set; }
        }

        internal class TelemetrySection
        {
            public string? EventName { get; set; }
            public Dictionary<string, string>? EventProperties { get; set; }
        }
    }
}
