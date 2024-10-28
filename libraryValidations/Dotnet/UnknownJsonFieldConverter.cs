using System.Text.Json;
using System.Text.Json.Serialization;

namespace Dotnet
{
    internal class UnknownJsonFieldConverter : JsonConverter<object>
    {
        public override object Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.String:
                    return reader.GetString();
                case JsonTokenType.Number:
                    if (reader.TryGetInt32(out int intValue))
                        return intValue;
                    if (reader.TryGetDouble(out double doubleValue))
                        return doubleValue;
                    break;
                case JsonTokenType.True:
                    return reader.GetBoolean();
                case JsonTokenType.False:
                    return reader.GetBoolean();
                case JsonTokenType.StartObject:
                    using (JsonDocument doc = JsonDocument.ParseValue(ref reader))
                    {
                        return doc.RootElement.Clone();
                    }
                case JsonTokenType.StartArray:
                    using (JsonDocument doc = JsonDocument.ParseValue(ref reader))
                    {
                        return doc.RootElement.Clone();
                    }
            }
            throw new JsonException("Unknown JSON token type.");
        }

        public override void Write(Utf8JsonWriter writer, object value, JsonSerializerOptions options)
        {
            JsonSerializer.Serialize(writer, value, value.GetType(), options);
        }
    }
}
