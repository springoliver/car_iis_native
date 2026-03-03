namespace System.Runtime.CompilerServices;

internal struct StringHandleOnStack(IntPtr pString)
{
	private IntPtr m_ptr = pString;
}
