namespace System.Runtime.InteropServices;

[ComVisible(true)]
public struct HandleRef(object wrapper, IntPtr handle)
{
	internal object m_wrapper = wrapper;

	internal IntPtr m_handle = handle;

	public object Wrapper => m_wrapper;

	public IntPtr Handle => m_handle;

	public static explicit operator IntPtr(HandleRef value)
	{
		return value.m_handle;
	}

	public static IntPtr ToIntPtr(HandleRef value)
	{
		return value.m_handle;
	}
}
