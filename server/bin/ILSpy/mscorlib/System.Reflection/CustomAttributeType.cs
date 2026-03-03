using System.Runtime.InteropServices;

namespace System.Reflection;

[Serializable]
[StructLayout(LayoutKind.Auto)]
internal struct CustomAttributeType(CustomAttributeEncoding encodedType, CustomAttributeEncoding encodedArrayType, CustomAttributeEncoding encodedEnumType, string enumName)
{
	private string m_enumName = enumName;

	private CustomAttributeEncoding m_encodedType = encodedType;

	private CustomAttributeEncoding m_encodedEnumType = encodedEnumType;

	private CustomAttributeEncoding m_encodedArrayType = encodedArrayType;

	private CustomAttributeEncoding m_padding = m_encodedType;

	public CustomAttributeEncoding EncodedType => m_encodedType;

	public CustomAttributeEncoding EncodedEnumType => m_encodedEnumType;

	public CustomAttributeEncoding EncodedArrayType => m_encodedArrayType;

	[ComVisible(true)]
	public string EnumName => m_enumName;
}
