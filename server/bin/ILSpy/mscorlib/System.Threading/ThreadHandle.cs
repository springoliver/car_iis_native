namespace System.Threading;

internal struct ThreadHandle(IntPtr pThread)
{
	private IntPtr m_ptr = pThread;
}
