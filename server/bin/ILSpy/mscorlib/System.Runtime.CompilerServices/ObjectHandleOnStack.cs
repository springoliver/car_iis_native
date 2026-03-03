namespace System.Runtime.CompilerServices;

internal struct ObjectHandleOnStack(IntPtr pObject)
{
	private IntPtr m_ptr = pObject;
}
