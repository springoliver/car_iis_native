using System.Runtime.InteropServices;

namespace System.Reflection;

[Serializable]
[StructLayout(LayoutKind.Auto)]
internal struct CustomAttributeCtorParameter(CustomAttributeType type)
{
	private CustomAttributeType m_type = type;

	private CustomAttributeEncodedArgument m_encodedArgument = default(CustomAttributeEncodedArgument);

	public CustomAttributeEncodedArgument CustomAttributeEncodedArgument => m_encodedArgument;
}
