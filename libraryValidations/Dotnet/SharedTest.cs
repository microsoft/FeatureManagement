using Microsoft.FeatureManagement;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dotnet
{
    internal class SharedTest
    {
        public string FeatureFlagName { get; set; }
        public InputsSection Inputs { get; set; }
        public IsEnabledSection IsEnabled { get; set; }
        public VariantSection Variant { get; set; }
        public string Description { get; set; }


        internal class InputsSection
        {
            public string user { get; set; }
            public string[] groups { get; set; }
        }

        internal class IsEnabledSection
        {
            public string Result { get; set; }
            public string Exception { get; set; }
        }

        internal class VariantSection
        {
            public string Result { get; set; }
            public string Exception { get; set; }
        }
    }
}
