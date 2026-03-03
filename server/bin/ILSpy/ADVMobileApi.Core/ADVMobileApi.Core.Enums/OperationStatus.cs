using System.Runtime.Serialization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace ADVMobileApi.Core.Enums;

[JsonConverter(typeof(StringEnumConverter))]
public enum OperationStatus
{
	[EnumMember(Value = "SUCCESS")]
	SUCCESS,
	[EnumMember(Value = "FAILURE")]
	FAILURE
}
